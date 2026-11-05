import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/property_model.dart';
import '../../data/property_repository.dart';
import '../widgets/property_card.dart';
import '../widgets/filter_sheet.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _repo = PropertyRepository();
  final _ctrl = TextEditingController();

  List<PropertyModel> _results = [];
  bool _loading  = false;
  bool _hasDone  = false;

  String? _filterNegocio;
  String? _filterProvincia;
  String? _filterTipoImovel;
  int?    _filterQuartosMin;
  double? _filterPrecoMax;

  @override void dispose() { _ctrl.dispose(); super.dispose(); }

  Future<void> _search() async {
    final q = _ctrl.text.trim();
    setState(() { _loading = true; _hasDone = false; });
    try {
      final r = await _repo.search(
        q: q.isNotEmpty ? q : null,
        tipoNegocio:  _filterNegocio,
        tipoImovel:   _filterTipoImovel,
        provincia:    _filterProvincia,
        quartosMin:   _filterQuartosMin,
        precoMax:     _filterPrecoMax,
      );
      setState(() { _results = r; _hasDone = true; });
    } catch (_) {
      setState(() { _results = []; _hasDone = true; });
    } finally {
      setState(() => _loading = false);
    }
  }

  void _applyFilters({
    String? negocio, String? provincia, String? tipoImovel,
    int? quartosMin, double? precoMax,
  }) {
    _filterNegocio    = negocio;
    _filterProvincia  = provincia;
    _filterTipoImovel = tipoImovel;
    _filterQuartosMin = quartosMin;
    _filterPrecoMax   = precoMax;
    _search();
  }

  bool get _hasFilters => _filterNegocio != null || _filterProvincia != null
      || _filterTipoImovel != null || _filterQuartosMin != null || _filterPrecoMax != null;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _ctrl,
          autofocus: true,
          style: const TextStyle(color: AppColors.textPrimary),
          onSubmitted: (_) => _search(),
          decoration: const InputDecoration(
            hintText: 'Localização, tipo, bairro...',
            border: InputBorder.none,
            hintStyle: TextStyle(color: AppColors.textHint)),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.search), onPressed: _search),
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.tune),
                color: _hasFilters ? AppColors.primary : null,
                onPressed: () => showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: AppColors.surface,
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
                  builder: (_) => FilterSheet(
                    currentNegocio:    _filterNegocio,
                    currentProvincia:  _filterProvincia,
                    currentTipoImovel: _filterTipoImovel,
                    currentQuartosMin: _filterQuartosMin,
                    currentPrecoMax:   _filterPrecoMax,
                    onApply: _applyFilters,
                  ),
                ),
              ),
              if (_hasFilters)
                Positioned(top: 10, right: 10,
                  child: Container(
                    width: 8, height: 8,
                    decoration: const BoxDecoration(
                      color: AppColors.primary, shape: BoxShape.circle))),
            ],
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : !_hasDone
              ? _Hint()
              : _results.isEmpty
                  ? _Empty(onClear: () {
                      _filterNegocio = _filterProvincia = _filterTipoImovel = null;
                      _filterQuartosMin = null; _filterPrecoMax = null;
                      _ctrl.clear();
                      setState(() => _hasDone = false);
                    })
                  : ListView.builder(
                      itemCount: _results.length,
                      itemBuilder: (_, i) => PropertyCard(property: _results[i]),
                    ),
    );
  }
}

class _Hint extends StatelessWidget {
  @override Widget build(BuildContext context) => const Center(
    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Icon(Icons.search, size: 64, color: AppColors.textHint),
      SizedBox(height: 12),
      Text('Pesquisa por localização, tipo ou bairro',
        textAlign: TextAlign.center,
        style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
    ]));
}

class _Empty extends StatelessWidget {
  const _Empty({required this.onClear});
  final VoidCallback onClear;
  @override Widget build(BuildContext context) => Center(
    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      const Icon(Icons.search_off, size: 56, color: AppColors.textHint),
      const SizedBox(height: 12),
      const Text('Nenhum resultado encontrado.',
        style: TextStyle(color: AppColors.textSecondary)),
      const SizedBox(height: 10),
      TextButton(onPressed: onClear,
        child: const Text('Limpar filtros', style: TextStyle(color: AppColors.primary))),
    ]));
}

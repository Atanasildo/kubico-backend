import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/property_model.dart';
import '../../data/property_repository.dart';
import '../widgets/property_card.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _repo = PropertyRepository();
  final _ctrl = TextEditingController();
  List<PropertyModel> _results = [];
  bool _searching = false;
  bool _hasDone = false;

  Future<void> _search() async {
    final q = _ctrl.text.trim();
    if (q.isEmpty) return;
    setState(() { _searching = true; _hasDone = false; });
    try {
      final r = await _repo.getProperties(search: q);
      setState(() { _results = r; _hasDone = true; });
    } catch (_) {
      setState(() { _results = []; _hasDone = true; });
    } finally {
      setState(() => _searching = false);
    }
  }

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
            hintStyle: TextStyle(color: AppColors.textHint),
          ),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.search), onPressed: _search),
        ],
      ),
      body: _searching
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : !_hasDone
              ? const _SearchHint()
              : _results.isEmpty
                  ? const Center(child: Text('Sem resultados.', style: TextStyle(color: AppColors.textSecondary)))
                  : ListView.builder(
                      itemCount: _results.length,
                      itemBuilder: (_, i) => PropertyCard(property: _results[i]),
                    ),
    );
  }
}

class _SearchHint extends StatelessWidget {
  const _SearchHint();
  @override
  Widget build(BuildContext context) => Center(
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: const [
        Icon(Icons.search, size: 64, color: AppColors.textHint),
        SizedBox(height: 12),
        Text('Pesquisa por localização,\ntipo de imóvel ou bairro',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
      ],
    ),
  );
}

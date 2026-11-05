import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../data/property_model.dart';
import '../../data/property_repository.dart';
import '../widgets/property_card.dart';
import '../widgets/filter_sheet.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _repo      = PropertyRepository();
  final _searchCtrl = TextEditingController();
  final _scroll    = ScrollController();

  List<PropertyModel> _items = [];
  bool _loading    = true;
  bool _loadingMore = false;
  bool _hasMore    = true;
  int  _skip       = 0;

  String? _filterNegocio;
  String? _filterProvincia;
  String? _filterTipoImovel;
  int?    _filterQuartosMin;
  double? _filterPrecoMax;

  @override
  void initState() {
    super.initState();
    _load(reset: true);
    _scroll.addListener(() {
      if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 300
          && !_loadingMore && _hasMore) _loadMore();
    });
  }

  @override
  void dispose() { _searchCtrl.dispose(); _scroll.dispose(); super.dispose(); }

  Future<void> _load({bool reset = false}) async {
    if (reset) { _skip = 0; _items = []; _hasMore = true; }
    if (!reset && _loadingMore) return;
    setState(() { if (reset) _loading = true; else _loadingMore = true; });
    try {
      final data = await _repo.search(
        skip: _skip, limit: 20,
        tipoNegocio: _filterNegocio,
        tipoImovel:  _filterTipoImovel,
        provincia:   _filterProvincia,
        quartosMin:  _filterQuartosMin,
        precoMax:    _filterPrecoMax,
        q: _searchCtrl.text.trim().isNotEmpty ? _searchCtrl.text.trim() : null,
      );
      setState(() {
        _items   = reset ? data : [..._items, ...data];
        _hasMore = data.length >= 20;
        _skip   += data.length;
      });
    } catch (_) {}
    setState(() { _loading = false; _loadingMore = false; });
  }

  Future<void> _loadMore() async => _load();

  void _applyFilters({
    String? negocio, String? provincia, String? tipoImovel,
    int? quartosMin, double? precoMax,
  }) {
    _filterNegocio   = negocio;
    _filterProvincia = provincia;
    _filterTipoImovel = tipoImovel;
    _filterQuartosMin = quartosMin;
    _filterPrecoMax   = precoMax;
    _load(reset: true);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      body: CustomScrollView(
        controller: _scroll,
        slivers: [
          _AppBar(auth: auth),
          _SearchBar(
            ctrl: _searchCtrl,
            onSearch: () => _load(reset: true),
            onFilter: () => showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: AppColors.surface,
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
              builder: (_) => FilterSheet(
                currentNegocio:   _filterNegocio,
                currentProvincia: _filterProvincia,
                currentTipoImovel: _filterTipoImovel,
                currentQuartosMin: _filterQuartosMin,
                currentPrecoMax:   _filterPrecoMax,
                onApply: _applyFilters,
              ),
            ),
          ),
          _Chips(
            selected: _filterNegocio,
            onSelect: (v) { _filterNegocio = v; _load(reset: true); },
          ),
          if (_loading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator(color: AppColors.primary)))
          else if (_items.isEmpty)
            SliverFillRemaining(child: _Empty(onRetry: () => _load(reset: true)))
          else ...[
            SliverList(delegate: SliverChildBuilderDelegate(
              (_, i) => PropertyCard(
                property: _items[i],
                onFavToggle: () {},
              ),
              childCount: _items.length,
            )),
            if (_loadingMore)
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Center(child: CircularProgressIndicator(
                    color: AppColors.primary, strokeWidth: 2)))),
          ],
        ],
      ),
    );
  }
}

// ── Sub-widgets ──────────────────────────────────────────────────────────────

class _AppBar extends StatelessWidget {
  const _AppBar({required this.auth});
  final AuthProvider auth;

  @override
  Widget build(BuildContext context) => SliverAppBar(
    floating: true,
    backgroundColor: AppColors.background,
    elevation: 0,
    title: Row(children: [
      Container(
        width: 32, height: 32,
        decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(8)),
        child: const Icon(Icons.home_rounded, color: Colors.white, size: 18)),
      const SizedBox(width: 8),
      const Text('kubico', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, letterSpacing: -0.5)),
    ]),
    actions: [
      IconButton(icon: const Icon(Icons.notifications_outlined), onPressed: () {}),
      Padding(
        padding: const EdgeInsets.only(right: 12),
        child: GestureDetector(
          onTap: () {},
          child: auth.user?.fotoPerfil != null
              ? CircleAvatar(radius: 16, backgroundImage: NetworkImage(auth.user!.fotoPerfil!))
              : CircleAvatar(
                  radius: 16, backgroundColor: AppColors.primary,
                  child: Text(
                    auth.user?.nome.isNotEmpty == true
                        ? auth.user!.nome[0].toUpperCase() : 'K',
                    style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600))),
        ),
      ),
    ],
  );
}

class _SearchBar extends StatelessWidget {
  const _SearchBar({required this.ctrl, required this.onSearch, required this.onFilter});
  final TextEditingController ctrl;
  final VoidCallback onSearch, onFilter;

  @override
  Widget build(BuildContext context) => SliverToBoxAdapter(
    child: Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: TextField(
        controller: ctrl,
        style: const TextStyle(color: AppColors.textPrimary),
        onSubmitted: (_) => onSearch(),
        decoration: InputDecoration(
          hintText: 'Localização, tipo, bairro...',
          prefixIcon: const Icon(Icons.search, color: AppColors.textSecondary, size: 20),
          suffixIcon: IconButton(
            icon: const Icon(Icons.tune, color: AppColors.primary, size: 20),
            onPressed: onFilter),
        ),
      ),
    ),
  );
}

class _Chips extends StatelessWidget {
  const _Chips({required this.selected, required this.onSelect});
  final String? selected;
  final void Function(String?) onSelect;

  @override
  Widget build(BuildContext context) => SliverToBoxAdapter(
    child: SizedBox(
      height: 48,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        children: [
          _Chip(label: 'Todos',        active: selected == null,           onTap: () => onSelect(null)),
          _Chip(label: 'Venda',        active: selected == 'venda',        onTap: () => onSelect('venda')),
          _Chip(label: 'Arrendamento', active: selected == 'arrendamento', onTap: () => onSelect('arrendamento')),
          ...AppConstants.provincias.take(6).map((p) => _Chip(
            label: p, active: false, onTap: () {})),
        ],
      ),
    ),
  );
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.active, required this.onTap});
  final String label; final bool active; final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: active ? AppColors.primary : AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: active ? AppColors.primary : AppColors.border),
      ),
      child: Text(label, style: TextStyle(
        fontSize: 13, fontWeight: FontWeight.w500,
        color: active ? Colors.white : AppColors.textSecondary)),
    ),
  );
}

class _Empty extends StatelessWidget {
  const _Empty({required this.onRetry});
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => Center(
    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      const Icon(Icons.home_work_outlined, size: 64, color: AppColors.textHint),
      const SizedBox(height: 14),
      const Text('Nenhum imóvel encontrado',
        style: TextStyle(fontSize: 15, color: AppColors.textSecondary)),
      const SizedBox(height: 10),
      TextButton(onPressed: onRetry,
        child: const Text('Tentar novamente', style: TextStyle(color: AppColors.primary))),
    ]),
  );
}

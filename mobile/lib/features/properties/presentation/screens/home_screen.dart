import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../data/property_model.dart';
import '../../data/property_repository.dart';
import '../widgets/property_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _repo = PropertyRepository();
  final _searchCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();

  List<PropertyModel> _items = [];
  bool _loading = true;
  bool _loadingMore = false;
  bool _hasMore = true;
  int _page = 1;

  String? _filterNegocio;
  String? _filterProvincia;

  @override
  void initState() {
    super.initState();
    _load();
    _scrollCtrl.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollCtrl.position.pixels >= _scrollCtrl.position.maxScrollExtent - 200
        && !_loadingMore && _hasMore) {
      _loadMore();
    }
  }

  Future<void> _load({bool reset = false}) async {
    if (reset) { _page = 1; _items = []; _hasMore = true; }
    setState(() => _loading = reset || _items.isEmpty);
    try {
      final data = await _repo.getProperties(
        page: _page,
        tipoNegocio: _filterNegocio,
        provincia: _filterProvincia,
        search: _searchCtrl.text.isNotEmpty ? _searchCtrl.text : null,
      );
      setState(() {
        _items = reset ? data : [..._items, ...data];
        _hasMore = data.length >= 20;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _loadMore() async {
    _page++;
    setState(() => _loadingMore = true);
    try {
      final data = await _repo.getProperties(
        page: _page,
        tipoNegocio: _filterNegocio,
        provincia: _filterProvincia,
      );
      setState(() {
        _items = [..._items, ...data];
        _hasMore = data.length >= 20;
        _loadingMore = false;
      });
    } catch (_) {
      _page--;
      setState(() => _loadingMore = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      body: CustomScrollView(
        controller: _scrollCtrl,
        slivers: [
          _buildAppBar(auth),
          _buildSearchBar(),
          _buildFilterChips(),
          if (_loading)
            const SliverFillRemaining(child: Center(
              child: CircularProgressIndicator(color: AppColors.primary)))
          else if (_items.isEmpty)
            SliverFillRemaining(child: _EmptyState(onRetry: () => _load(reset: true)))
          else ...[
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (_, i) => PropertyCard(
                  property: _items[i],
                  onFavoriteToggle: () {},
                ),
                childCount: _items.length,
              ),
            ),
            if (_loadingMore)
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Center(child: CircularProgressIndicator(
                    color: AppColors.primary, strokeWidth: 2)),
                )),
          ],
        ],
      ),
    );
  }

  Widget _buildAppBar(AuthProvider auth) {
    return SliverAppBar(
      floating: true,
      backgroundColor: AppColors.background,
      elevation: 0,
      title: Row(children: [
        Container(
          width: 32, height: 32,
          decoration: BoxDecoration(
            color: AppColors.primary, borderRadius: BorderRadius.circular(8)),
          child: const Icon(Icons.home_rounded, color: Colors.white, size: 18),
        ),
        const SizedBox(width: 8),
        const Text('kubico', style: TextStyle(
          fontSize: 20, fontWeight: FontWeight.w700, letterSpacing: -0.5)),
      ]),
      actions: [
        IconButton(
          icon: const Icon(Icons.notifications_outlined),
          onPressed: () {},
        ),
        if (auth.user?.fotoPerfil != null)
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: CircleAvatar(
              radius: 16,
              backgroundImage: NetworkImage(auth.user!.fotoPerfil!),
            ),
          )
        else
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: CircleAvatar(
              radius: 16, backgroundColor: AppColors.primary,
              child: Text(auth.user?.nome.substring(0, 1).toUpperCase() ?? 'K',
                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
            ),
          ),
      ],
    );
  }

  Widget _buildSearchBar() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
        child: TextField(
          controller: _searchCtrl,
          style: const TextStyle(color: AppColors.textPrimary),
          onSubmitted: (_) => _load(reset: true),
          decoration: InputDecoration(
            hintText: 'Pesquisar imóveis...',
            prefixIcon: const Icon(Icons.search, color: AppColors.textSecondary, size: 20),
            suffixIcon: IconButton(
              icon: const Icon(Icons.tune, color: AppColors.primary, size: 20),
              onPressed: _showFilters,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChips() {
    return SliverToBoxAdapter(
      child: SizedBox(
        height: 50,
        child: ListView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          children: [
            _FilterChip(
              label: 'Todos',
              active: _filterNegocio == null,
              onTap: () { _filterNegocio = null; _load(reset: true); },
            ),
            _FilterChip(
              label: 'Venda',
              active: _filterNegocio == 'venda',
              onTap: () { _filterNegocio = 'venda'; _load(reset: true); },
            ),
            _FilterChip(
              label: 'Arrendamento',
              active: _filterNegocio == 'arrendamento',
              onTap: () { _filterNegocio = 'arrendamento'; _load(reset: true); },
            ),
            ...AppConstants.provincias.take(5).map((p) => _FilterChip(
              label: p,
              active: _filterProvincia == p,
              onTap: () {
                _filterProvincia = _filterProvincia == p ? null : p;
                _load(reset: true);
              },
            )),
          ],
        ),
      ),
    );
  }

  void _showFilters() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _FilterSheet(
        currentNegocio: _filterNegocio,
        currentProvincia: _filterProvincia,
        onApply: (negocio, provincia) {
          setState(() { _filterNegocio = negocio; _filterProvincia = provincia; });
          _load(reset: true);
        },
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({required this.label, required this.active, required this.onTap});
  final String label;
  final bool active;
  final VoidCallback onTap;

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
      child: Text(label,
        style: TextStyle(
          fontSize: 13, fontWeight: FontWeight.w500,
          color: active ? Colors.white : AppColors.textSecondary)),
    ),
  );
}

class _FilterSheet extends StatefulWidget {
  const _FilterSheet({this.currentNegocio, this.currentProvincia, required this.onApply});
  final String? currentNegocio;
  final String? currentProvincia;
  final void Function(String? negocio, String? provincia) onApply;

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  String? _negocio;
  String? _provincia;

  @override
  void initState() {
    super.initState();
    _negocio = widget.currentNegocio;
    _provincia = widget.currentProvincia;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('Filtros', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            TextButton(
              onPressed: () { _negocio = null; _provincia = null; setState(() {}); },
              child: const Text('Limpar', style: TextStyle(color: AppColors.primary)),
            ),
          ]),
          const SizedBox(height: 16),
          const Text('Tipo de negócio', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          Row(children: [
            _SheetChip(label: 'Venda', active: _negocio == 'venda',
              onTap: () => setState(() => _negocio = _negocio == 'venda' ? null : 'venda')),
            const SizedBox(width: 10),
            _SheetChip(label: 'Arrendamento', active: _negocio == 'arrendamento',
              onTap: () => setState(() => _negocio = _negocio == 'arrendamento' ? null : 'arrendamento')),
          ]),
          const SizedBox(height: 20),
          const Text('Província', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _provincia,
            dropdownColor: AppColors.surface,
            hint: const Text('Todas as províncias', style: TextStyle(color: AppColors.textHint)),
            style: const TextStyle(color: AppColors.textPrimary),
            items: AppConstants.provincias.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
            onChanged: (v) => setState(() => _provincia = v),
            decoration: const InputDecoration(),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              widget.onApply(_negocio, _provincia);
            },
            child: const Text('Aplicar filtros'),
          ),
        ],
      ),
    );
  }
}

class _SheetChip extends StatelessWidget {
  const _SheetChip({required this.label, required this.active, required this.onTap});
  final String label;
  final bool active;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: active ? AppColors.primary.withOpacity(0.15) : AppColors.surfaceVariant,
        border: Border.all(color: active ? AppColors.primary : AppColors.border),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(label, style: TextStyle(
        color: active ? AppColors.primary : AppColors.textSecondary,
        fontWeight: active ? FontWeight.w600 : FontWeight.w400)),
    ),
  );
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onRetry});
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => Center(
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.home_work_outlined, size: 64, color: AppColors.textHint),
        const SizedBox(height: 16),
        const Text('Nenhum imóvel encontrado', style: TextStyle(fontSize: 16, color: AppColors.textSecondary)),
        const SizedBox(height: 8),
        TextButton(onPressed: onRetry, child: const Text('Tentar novamente', style: TextStyle(color: AppColors.primary))),
      ],
    ),
  );
}

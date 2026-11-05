import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../data/property_model.dart';
import '../../data/property_repository.dart';
import 'edit_property_screen.dart';
import 'report_property_screen.dart';

class PropertyDetailScreen extends StatefulWidget {
  const PropertyDetailScreen({super.key, required this.property});
  final PropertyModel property;
  @override State<PropertyDetailScreen> createState() => _PropertyDetailScreenState();
}

class _PropertyDetailScreenState extends State<PropertyDetailScreen> {
  final _repo = PropertyRepository();
  late PropertyModel _p;
  bool _fav = false;
  int  _imgIndex = 0;

  @override
  void initState() {
    super.initState();
    _p = widget.property;
    // registar lead de visualização
    _repo.registerLead(propertyId: _p.id, canal: 'whatsapp');
  }

  Future<void> _toggleFav() async {
    final ok = await _repo.toggleFavorite(_p.id);
    setState(() => _fav = ok);
  }

  void _openWhatsApp() async {
    final raw = _p.contactoWhatsapp ?? _p.contactoTelefone ?? '';
    if (raw.isEmpty) return;
    final digits = raw.replaceAll(RegExp(r'\D'), '');
    final phone  = digits.startsWith('244') ? digits : '244$digits';
    final msg    = Uri.encodeComponent(
      'Olá! Tenho interesse no imóvel "${_p.titulo}" '
      '(${_p.precoFormatado}) em ${_p.municipio}, ${_p.provincia}. '
      'Ainda está disponível?');
    final uri = Uri.parse('https://wa.me/$phone?text=$msg');
    if (await canLaunchUrl(uri)) launchUrl(uri, mode: LaunchMode.externalApplication);
    _repo.registerLead(propertyId: _p.id, canal: 'whatsapp');
  }

  void _callPhone() async {
    final raw = _p.contactoTelefone ?? '';
    if (raw.isEmpty) return;
    final digits = raw.replaceAll(RegExp(r'\D'), '');
    final phone  = digits.startsWith('244') ? digits : '244$digits';
    await launchUrl(Uri.parse('tel:+$phone'));
    _repo.registerLead(propertyId: _p.id, canal: 'telefone');
  }

  @override
  Widget build(BuildContext context) {
    final auth  = context.watch<AuthProvider>();
    final isOwn = auth.user?.id == _p.autorId;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // ── Galeria ──────────────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 290,
            pinned: true,
            backgroundColor: AppColors.background,
            actions: [
              IconButton(
                icon: Icon(_fav ? Icons.favorite : Icons.favorite_border,
                  color: _fav ? AppColors.error : Colors.white),
                onPressed: _toggleFav),
              PopupMenuButton<String>(
                color: AppColors.surface,
                icon: const Icon(Icons.more_vert, color: Colors.white),
                onSelected: (v) {
                  if (v == 'edit' && isOwn) {
                    Navigator.push(context,
                      MaterialPageRoute(builder: (_) => EditPropertyScreen(property: _p)));
                  } else if (v == 'report') {
                    Navigator.push(context,
                      MaterialPageRoute(builder: (_) => ReportPropertyScreen(propertyId: _p.id)));
                  }
                },
                itemBuilder: (_) => [
                  if (isOwn)
                    const PopupMenuItem(value: 'edit',
                      child: Row(children: [Icon(Icons.edit_outlined, size: 16), SizedBox(width: 8), Text('Editar')])),
                  const PopupMenuItem(value: 'report',
                    child: Row(children: [Icon(Icons.flag_outlined, size: 16, color: AppColors.error), SizedBox(width: 8),
                      Text('Denunciar', style: TextStyle(color: AppColors.error))])),
                ],
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: _p.imagens.isNotEmpty
                  ? Stack(
                      children: [
                        PageView.builder(
                          itemCount: _p.imagens.length,
                          onPageChanged: (i) => setState(() => _imgIndex = i),
                          itemBuilder: (_, i) => CachedNetworkImage(
                            imageUrl: _p.imagens[i],
                            fit: BoxFit.cover,
                            errorWidget: (_, __, ___) => _NoImg()),
                        ),
                        if (_p.imagens.length > 1)
                          Positioned(bottom: 12, right: 12,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.6),
                                borderRadius: BorderRadius.circular(20)),
                              child: Text('${_imgIndex + 1}/${_p.imagens.length}',
                                style: const TextStyle(color: Colors.white, fontSize: 12)))),
                      ],
                    )
                  : _NoImg(),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                // ── Preço e tag ──────────────────────────────────────────
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Text(_p.precoFormatado,
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primary)),
                  _NegTag(tipo: _p.tipoNegocio),
                ]),
                const SizedBox(height: 8),
                Text(_p.titulo,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                Row(children: [
                  const Icon(Icons.location_on_outlined, size: 15, color: AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Expanded(child: Text('${_p.localizacao}, ${_p.provincia}',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13))),
                ]),
                // Badges
                const SizedBox(height: 10),
                Wrap(spacing: 8, children: [
                  if (_p.verificado)
                    _Badge(icon: Icons.verified, label: 'Verificado', color: AppColors.success),
                  if (_p.emDestaque)
                    _Badge(icon: Icons.star, label: 'Destaque', color: AppColors.destaque, dark: true),
                ]),

                // ── Características ──────────────────────────────────────
                const SizedBox(height: 22),
                _SectionTitle('Características'),
                const SizedBox(height: 12),
                _SpecGrid(p: _p),

                // ── Descrição ────────────────────────────────────────────
                if (_p.descricao != null && _p.descricao!.isNotEmpty) ...[
                  const SizedBox(height: 22),
                  _SectionTitle('Descrição'),
                  const SizedBox(height: 8),
                  Text(_p.descricao!,
                    style: const TextStyle(color: AppColors.textSecondary, height: 1.65, fontSize: 14)),
                ],

                // ── Comodidades ───────────────────────────────────────────
                const SizedBox(height: 22),
                _SectionTitle('Comodidades'),
                const SizedBox(height: 12),
                _AmenitiesGrid(p: _p),

                // ── Referência de localização ─────────────────────────────
                if (_p.enderecoReferencia != null) ...[
                  const SizedBox(height: 22),
                  _SectionTitle('Referência'),
                  const SizedBox(height: 8),
                  Row(children: [
                    const Icon(Icons.info_outline, size: 14, color: AppColors.textSecondary),
                    const SizedBox(width: 6),
                    Expanded(child: Text(_p.enderecoReferencia!,
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 13))),
                  ]),
                ],

                // ── Estatísticas (apenas dono) ────────────────────────────
                if (isOwn) ...[
                  const SizedBox(height: 22),
                  _SectionTitle('Estatísticas'),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border)),
                    child: Row(children: [
                      const Icon(Icons.visibility_outlined, size: 16, color: AppColors.textSecondary),
                      const SizedBox(width: 8),
                      Text('${_p.visualizacoes} visualizações',
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                    ]),
                  ),
                ],

                const SizedBox(height: 100),
              ]),
            ),
          ),
        ],
      ),

      // ── Barra de contacto ────────────────────────────────────────────────
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.border))),
        child: Row(children: [
          if (_p.contactoTelefone != null) ...[
            Expanded(child: OutlinedButton.icon(
              onPressed: _callPhone,
              icon: const Icon(Icons.phone_outlined, size: 18),
              label: const Text('Ligar'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.textPrimary,
                side: const BorderSide(color: AppColors.border),
                minimumSize: const Size(0, 50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            )),
            const SizedBox(width: 10),
          ],
          Expanded(
            flex: 2,
            child: ElevatedButton.icon(
              onPressed: _openWhatsApp,
              icon: const Icon(Icons.chat, size: 18),
              label: const Text('WhatsApp'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.whatsapp,
                minimumSize: const Size(0, 50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            ),
          ),
        ]),
      ),
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

class _NoImg extends StatelessWidget {
  @override Widget build(BuildContext context) => Container(
    color: AppColors.surfaceVariant,
    child: const Center(child: Icon(Icons.home_outlined, size: 72, color: AppColors.textHint)));
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.t);
  final String t;
  @override Widget build(BuildContext context) =>
      Text(t, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600));
}

class _Badge extends StatelessWidget {
  const _Badge({required this.icon, required this.label, required this.color, this.dark = false});
  final IconData icon; final String label; final Color color; final bool dark;
  @override Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: color.withOpacity(0.12),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: color.withOpacity(0.3))),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 13, color: color),
      const SizedBox(width: 4),
      Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
    ]));
}

class _NegTag extends StatelessWidget {
  const _NegTag({required this.tipo});
  final String tipo;
  @override Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
    decoration: BoxDecoration(
      color: tipo == 'venda' ? AppColors.primary.withOpacity(0.15) : AppColors.success.withOpacity(0.15),
      borderRadius: BorderRadius.circular(8)),
    child: Text(tipo == 'venda' ? 'Venda' : 'Arrendamento',
      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13,
        color: tipo == 'venda' ? AppColors.primary : AppColors.success)));
}

class _SpecGrid extends StatelessWidget {
  const _SpecGrid({required this.p});
  final PropertyModel p;
  @override Widget build(BuildContext context) {
    final specs = [
      if (p.quartos > 0)    ['${p.quartos}', 'Quartos', Icons.bed_outlined],
      if (p.casasBanho > 0) ['${p.casasBanho}', 'Casas de Banho', Icons.bathtub_outlined],
      if (p.garagens > 0)   ['${p.garagens}', 'Garagens', Icons.garage_outlined],
      if (p.salas > 0)      ['${p.salas}', 'Salas', Icons.weekend_outlined],
      if (p.cozinhas > 0)   ['${p.cozinhas}', 'Cozinhas', Icons.kitchen_outlined],
      if (p.areaM2 != null) ['${p.areaM2!.toStringAsFixed(0)}m²', 'Área', Icons.square_foot],
      if (p.andares > 0)    ['${p.andares}º', 'Andar', Icons.layers_outlined],
    ];
    final w = (MediaQuery.of(context).size.width - 60) / 2;
    return Wrap(spacing: 10, runSpacing: 10, children: specs.map((s) =>
      Container(
        width: w, padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surfaceVariant, borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border)),
        child: Row(children: [
          Icon(s[2] as IconData, size: 20, color: AppColors.primary),
          const SizedBox(width: 10),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(s[0] as String, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            Text(s[1] as String, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          ]),
        ]),
      )).toList());
  }
}

class _AmenitiesGrid extends StatelessWidget {
  const _AmenitiesGrid({required this.p});
  final PropertyModel p;
  @override Widget build(BuildContext context) {
    final items = [
      ('Energia eléctrica', p.temEnergia),
      ('Água canalizada',   p.temAgua),
      ('Gerador',           p.temGerador),
      ('Fossa séptica',     p.temFossaSeptica),
      ('Mobilado',          p.mobilado),
      ('Piscina',           p.temPiscina),
      ('Quintal',           p.temQuintal),
    ];
    return Wrap(spacing: 8, runSpacing: 8, children: items.map((e) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: e.$2 ? AppColors.primary.withOpacity(0.1) : AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: e.$2 ? AppColors.primary.withOpacity(0.3) : AppColors.border)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(e.$2 ? Icons.check_circle_outline : Icons.cancel_outlined,
          size: 14, color: e.$2 ? AppColors.primary : AppColors.textHint),
        const SizedBox(width: 6),
        Text(e.$1, style: TextStyle(fontSize: 12,
          color: e.$2 ? AppColors.textPrimary : AppColors.textHint)),
      ]),
    )).toList());
  }
}

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/property_model.dart';

class PropertyDetailScreen extends StatelessWidget {
  const PropertyDetailScreen({super.key, required this.property});
  final PropertyModel property;

  void _openWhatsApp(BuildContext ctx) async {
    final number = property.contactoWhatsapp?.replaceAll(RegExp(r'\D'), '') ?? '';
    if (number.isEmpty) return;
    final uri = Uri.parse('${AppConstants.whatsappBase}$number?text='
        'Olá! Vi o seu anúncio no Kubico: "${property.titulo}". Tenho interesse.');
    if (await canLaunchUrl(uri)) {
      launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _callPhone(BuildContext ctx) async {
    final tel = property.contactoTelefone?.replaceAll(RegExp(r'\D'), '') ?? '';
    if (tel.isEmpty) return;
    final uri = Uri.parse('tel:+244$tel');
    if (await canLaunchUrl(uri)) launchUrl(uri);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            backgroundColor: AppColors.background,
            flexibleSpace: FlexibleSpaceBar(
              background: property.imagens.isNotEmpty
                  ? PageView.builder(
                      itemCount: property.imagens.length,
                      itemBuilder: (_, i) => CachedNetworkImage(
                        imageUrl: property.imagens[i],
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => Container(
                          color: AppColors.surfaceVariant,
                          child: const Icon(Icons.home_outlined, size: 64, color: AppColors.textHint)),
                      ),
                    )
                  : Container(
                      color: AppColors.surfaceVariant,
                      child: const Icon(Icons.home_outlined, size: 80, color: AppColors.textHint)),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(property.precoFormatado,
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primary)),
                      _NegocioTag(tipo: property.tipoNegocio),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(property.titulo,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  Row(children: [
                    const Icon(Icons.location_on_outlined, size: 16, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text('${property.localizacao}, ${property.provincia}',
                      style: const TextStyle(color: AppColors.textSecondary)),
                  ]),
                  if (property.verificado) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.success.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.success.withOpacity(0.3)),
                      ),
                      child: const Row(mainAxisSize: MainAxisSize.min, children: [
                        Icon(Icons.verified, size: 14, color: AppColors.success),
                        SizedBox(width: 4),
                        Text('Imóvel verificado', style: TextStyle(fontSize: 12, color: AppColors.success, fontWeight: FontWeight.w500)),
                      ]),
                    ),
                  ],
                  const SizedBox(height: 20),
                  _SectionTitle('Características'),
                  const SizedBox(height: 12),
                  _SpecGrid(property: property),
                  if (property.descricao != null && property.descricao!.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    _SectionTitle('Descrição'),
                    const SizedBox(height: 8),
                    Text(property.descricao!,
                      style: const TextStyle(color: AppColors.textSecondary, height: 1.6)),
                  ],
                  const SizedBox(height: 20),
                  _SectionTitle('Comodidades'),
                  const SizedBox(height: 12),
                  _AmenitiesGrid(property: property),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.border)),
        ),
        child: Row(children: [
          if (property.contactoTelefone != null)
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _callPhone(context),
                icon: const Icon(Icons.phone_outlined, size: 18),
                label: const Text('Ligar'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.textPrimary,
                  side: const BorderSide(color: AppColors.border),
                  minimumSize: const Size(0, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          if (property.contactoTelefone != null) const SizedBox(width: 10),
          Expanded(
            flex: 2,
            child: ElevatedButton.icon(
              onPressed: () => _openWhatsApp(context),
              icon: const Icon(Icons.chat_outlined, size: 18),
              label: const Text('WhatsApp'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.whatsapp,
                minimumSize: const Size(0, 50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ]),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);
  final String title;
  @override
  Widget build(BuildContext context) => Text(title,
    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600));
}

class _SpecGrid extends StatelessWidget {
  const _SpecGrid({required this.property});
  final PropertyModel property;

  @override
  Widget build(BuildContext context) {
    final specs = <_SpecItem>[
      if (property.quartos > 0)    _SpecItem(Icons.bed_outlined,      '${property.quartos}', 'Quartos'),
      if (property.casasBanho > 0) _SpecItem(Icons.bathtub_outlined,  '${property.casasBanho}', 'Casas de Banho'),
      if (property.garagens > 0)   _SpecItem(Icons.garage_outlined,   '${property.garagens}', 'Garagens'),
      if (property.areaM2 != null) _SpecItem(Icons.square_foot,       '${property.areaM2!.toStringAsFixed(0)}m²', 'Área'),
    ];
    return Wrap(
      spacing: 10, runSpacing: 10,
      children: specs.map((s) => Container(
        width: (MediaQuery.of(context).size.width - 60) / 2,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surfaceVariant,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(children: [
          Icon(s.icon, size: 20, color: AppColors.primary),
          const SizedBox(width: 10),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(s.value, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            Text(s.label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          ]),
        ]),
      )).toList(),
    );
  }
}

class _SpecItem { final IconData icon; final String value, label; const _SpecItem(this.icon, this.value, this.label); }

class _AmenitiesGrid extends StatelessWidget {
  const _AmenitiesGrid({required this.property});
  final PropertyModel property;

  @override
  Widget build(BuildContext context) {
    final items = <MapEntry<String, bool>>[
      MapEntry('Energia eléctrica', property.temEnergia),
      MapEntry('Água canalizada', property.temAgua),
      MapEntry('Mobilado', property.mobilado),
      MapEntry('Piscina', property.temPiscina),
      MapEntry('Quintal', property.temQuintal),
    ];
    return Wrap(
      spacing: 8, runSpacing: 8,
      children: items.map((e) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: e.value ? AppColors.primary.withOpacity(0.1) : AppColors.surfaceVariant,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: e.value ? AppColors.primary.withOpacity(0.3) : AppColors.border),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(e.value ? Icons.check_circle_outline : Icons.cancel_outlined,
            size: 14,
            color: e.value ? AppColors.primary : AppColors.textHint),
          const SizedBox(width: 6),
          Text(e.key, style: TextStyle(
            fontSize: 12,
            color: e.value ? AppColors.textPrimary : AppColors.textHint)),
        ]),
      )).toList(),
    );
  }
}

class _NegocioTag extends StatelessWidget {
  const _NegocioTag({required this.tipo});
  final String tipo;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
    decoration: BoxDecoration(
      color: tipo == 'venda' ? AppColors.primary.withOpacity(0.15) : AppColors.success.withOpacity(0.15),
      borderRadius: BorderRadius.circular(8),
    ),
    child: Text(tipo == 'venda' ? 'Venda' : 'Arrendamento',
      style: TextStyle(
        fontWeight: FontWeight.w600, fontSize: 13,
        color: tipo == 'venda' ? AppColors.primary : AppColors.success)),
  );
}

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/card_action.dart';
import '../../data/property_model.dart';
import '../screens/property_detail_screen.dart';

class PropertyCard extends StatelessWidget {
  const PropertyCard({
    super.key,
    required this.property,
    this.onFavToggle,
    this.actions,
  });
  final PropertyModel      property;
  final VoidCallback?      onFavToggle;
  final List<CardAction>?  actions;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(context,
        MaterialPageRoute(builder: (_) => PropertyDetailScreen(property: property))),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _ImageSection(property: property, onFav: onFavToggle),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text(property.precoFormatado,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.primary)),
                _NegTag(tipo: property.tipoNegocio),
              ]),
              const SizedBox(height: 6),
              Text(property.titulo,
                maxLines: 1, overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
              const SizedBox(height: 4),
              Row(children: [
                const Icon(Icons.location_on_outlined, size: 14, color: AppColors.textSecondary),
                const SizedBox(width: 4),
                Expanded(child: Text(property.localizacao,
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 13, color: AppColors.textSecondary))),
              ]),
              const SizedBox(height: 10),
              _SpecRow(property: property),
              if (actions != null && actions!.isNotEmpty) ...[
                const SizedBox(height: 10),
                const Divider(height: 1),
                const SizedBox(height: 8),
                Row(children: actions!.map((a) => Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: GestureDetector(
                    onTap: a.onTap,
                    child: Row(children: [
                      Icon(a.icon, size: 15, color: AppColors.primary),
                      const SizedBox(width: 4),
                      Text(a.label,
                        style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w500)),
                    ]),
                  ),
                )).toList()),
              ],
            ]),
          ),
        ]),
      ),
    );
  }
}

class _ImageSection extends StatelessWidget {
  const _ImageSection({required this.property, this.onFav});
  final PropertyModel property;
  final VoidCallback? onFav;

  @override
  Widget build(BuildContext context) => Stack(children: [
    ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
      child: property.thumbUrl != null
          ? CachedNetworkImage(
              imageUrl: property.thumbUrl!,
              height: 200, width: double.infinity, fit: BoxFit.cover,
              placeholder: (_, __) => Shimmer.fromColors(
                baseColor: AppColors.surface, highlightColor: AppColors.surfaceVariant,
                child: Container(height: 200, color: AppColors.surface)),
              errorWidget: (_, __, ___) => _NoImg())
          : _NoImg(),
    ),
    if (property.emDestaque)
      Positioned(top: 10, left: 10,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(color: AppColors.destaque, borderRadius: BorderRadius.circular(20)),
          child: const Text('★ Destaque',
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.black)))),
    if (property.verificado)
      Positioned(top: 10, right: onFav != null ? 48 : 10,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.success.withOpacity(0.9), borderRadius: BorderRadius.circular(20)),
          child: const Row(children: [
            Icon(Icons.verified, size: 11, color: Colors.white),
            SizedBox(width: 3),
            Text('Verificado', style: TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w600)),
          ]))),
    if (onFav != null)
      Positioned(top: 8, right: 8,
        child: GestureDetector(
          onTap: onFav,
          child: Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.5), shape: BoxShape.circle),
            child: const Icon(Icons.favorite_border, color: Colors.white, size: 18)))),
  ]);
}

class _NoImg extends StatelessWidget {
  @override Widget build(BuildContext context) => Container(
    height: 200, width: double.infinity, color: AppColors.surfaceVariant,
    child: const Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Icon(Icons.home_outlined, size: 48, color: AppColors.textHint),
      SizedBox(height: 6),
      Text('Sem imagem', style: TextStyle(color: AppColors.textHint, fontSize: 12)),
    ]));
}

class _SpecRow extends StatelessWidget {
  const _SpecRow({required this.property});
  final PropertyModel property;
  @override Widget build(BuildContext context) => Wrap(spacing: 14, children: [
    if (property.quartos > 0)    _Spec(Icons.bed_outlined,     '${property.quartos} qts'),
    if (property.casasBanho > 0) _Spec(Icons.bathtub_outlined, '${property.casasBanho} WC'),
    if (property.areaM2 != null) _Spec(Icons.square_foot,      '${property.areaM2!.toStringAsFixed(0)} m²'),
    if (property.garagens > 0)   _Spec(Icons.garage_outlined,  '${property.garagens} gar.'),
  ]);
}

class _Spec extends StatelessWidget {
  const _Spec(this.icon, this.label);
  final IconData icon; final String label;
  @override Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
    Icon(icon, size: 14, color: AppColors.textSecondary),
    const SizedBox(width: 4),
    Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
  ]);
}

class _NegTag extends StatelessWidget {
  const _NegTag({required this.tipo});
  final String tipo;
  @override Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(
      color: tipo == 'venda'
          ? AppColors.primary.withOpacity(0.15)
          : AppColors.success.withOpacity(0.15),
      borderRadius: BorderRadius.circular(6)),
    child: Text(tipo == 'venda' ? 'Venda' : 'Arrendamento',
      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600,
        color: tipo == 'venda' ? AppColors.primary : AppColors.success)));
}

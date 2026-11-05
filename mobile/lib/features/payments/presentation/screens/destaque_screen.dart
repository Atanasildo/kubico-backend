import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/kubico_button.dart';
import '../../../properties/data/property_model.dart';
import '../../../properties/data/property_repository.dart';

class DestaqueScreen extends StatefulWidget {
  const DestaqueScreen({super.key, required this.property});
  final PropertyModel property;
  @override State<DestaqueScreen> createState() => _DestaqueScreenState();
}

class _DestaqueScreenState extends State<DestaqueScreen> {
  final _repo = PropertyRepository();
  int  _dias    = 7;
  bool _loading = false;

  static const _planos = [
    {'dias': 7,  'preco': 25,  'label': '7 dias',  'desc': 'Destaque básico — ideal para testar'},
    {'dias': 15, 'preco': 45,  'label': '15 dias', 'desc': 'Mais visibilidade, mais contactos'},
    {'dias': 30, 'preco': 80,  'label': '30 dias', 'desc': 'Máximo de exposição — mais vendido'},
  ];

  Future<void> _pay() async {
    setState(() => _loading = true);
    try {
      final result = await _repo.pagarDestaque(
        propertyId: widget.property.id,
        dias: _dias,
      );
      if (mounted) {
        showDialog(
          context: context,
          builder: (_) => AlertDialog(
            backgroundColor: AppColors.surface,
            title: const Text('Referência de pagamento'),
            content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              _InfoRow('Entidade', '${result['entidade'] ?? '—'}'),
              _InfoRow('Referência', '${result['referencia'] ?? '—'}'),
              _InfoRow('Valor', '${result['valor'] ?? '—'} AOA'),
              _InfoRow('Validade', '${result['validade'] ?? '—'}'),
              const SizedBox(height: 10),
              const Text('Paga no Multicaixa Express ou ATM com estes dados.',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            ]),
            actions: [
              TextButton(
                onPressed: () { Navigator.pop(context); Navigator.pop(context); },
                child: const Text('OK', style: TextStyle(color: AppColors.primary))),
            ],
          ),
        );
      }
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Erro ao gerar referência.'), backgroundColor: AppColors.error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Colocar em destaque')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.destaque.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.destaque.withOpacity(0.3))),
            child: Row(children: [
              const Icon(Icons.star, color: AppColors.destaque, size: 20),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(widget.property.titulo,
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                Text(widget.property.precoFormatado,
                  style: const TextStyle(color: AppColors.primary, fontSize: 13)),
              ])),
            ]),
          ),
          const SizedBox(height: 24),
          const Text('Escolhe o plano', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 14),
          Expanded(
            child: ListView(children: _planos.map((p) => GestureDetector(
              onTap: () => setState(() => _dias = p['dias'] as int),
              child: Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _dias == p['dias'] ? AppColors.primary.withOpacity(0.1) : AppColors.card,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: _dias == p['dias'] ? AppColors.primary : AppColors.border,
                    width: _dias == p['dias'] ? 1.5 : 1)),
                child: Row(children: [
                  Container(
                    width: 20, height: 20,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: _dias == p['dias'] ? AppColors.primary : AppColors.border,
                        width: 2)),
                    child: _dias == p['dias']
                        ? const Center(child: Icon(Icons.circle, size: 10, color: AppColors.primary))
                        : null,
                  ),
                  const SizedBox(width: 14),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(p['label'] as String,
                      style: TextStyle(fontWeight: FontWeight.w600,
                        color: _dias == p['dias'] ? AppColors.primary : AppColors.textPrimary)),
                    Text(p['desc'] as String,
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  ])),
                  Text('${p['preco']} USD',
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: AppColors.primary)),
                ]),
              ),
            )).toList()),
          ),
          KubicoButton(label: 'Gerar referência de pagamento', onPressed: _pay, loading: _loading),
          const SizedBox(height: 8),
          const Center(child: Text('Pagamento via Multicaixa Express',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary))),
        ]),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.label, this.value);
  final String label, value;
  @override Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(children: [
      SizedBox(width: 90, child: Text('$label:', style: const TextStyle(color: AppColors.textSecondary, fontSize: 13))),
      Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
    ]));
}

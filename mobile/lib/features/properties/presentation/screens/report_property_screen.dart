import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/kubico_button.dart';
import '../../data/property_repository.dart';

class ReportPropertyScreen extends StatefulWidget {
  const ReportPropertyScreen({super.key, required this.propertyId});
  final String propertyId;
  @override State<ReportPropertyScreen> createState() => _ReportPropertyScreenState();
}

class _ReportPropertyScreenState extends State<ReportPropertyScreen> {
  final _repo     = PropertyRepository();
  final _descCtrl = TextEditingController();
  String? _motivo;
  bool    _loading = false;

  static const _motivos = [
    'preco_incorreto',
    'imovel_inexistente',
    'imagens_falsas',
    'contacto_invalido',
    'duplicado',
    'fraude',
    'outro',
  ];

  static const _labels = {
    'preco_incorreto':   'Preço incorrecto',
    'imovel_inexistente':'Imóvel inexistente',
    'imagens_falsas':    'Imagens falsas',
    'contacto_invalido': 'Contacto inválido',
    'duplicado':         'Anúncio duplicado',
    'fraude':            'Suspeita de fraude',
    'outro':             'Outro motivo',
  };

  Future<void> _submit() async {
    if (_motivo == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecciona um motivo.'),
          backgroundColor: AppColors.error));
      return;
    }
    setState(() => _loading = true);
    try {
      await _repo.report(
        propertyId: widget.propertyId,
        motivo:     _motivo!,
        descricao:  _descCtrl.text.isNotEmpty ? _descCtrl.text : null,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Denúncia enviada. Obrigado.'),
            backgroundColor: AppColors.success));
        Navigator.pop(context);
      }
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Erro ao enviar. Tenta novamente.'),
          backgroundColor: AppColors.error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() { _descCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Denunciar anúncio')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Qual é o problema?',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          const Text('A tua denúncia é anónima.',
            style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          const SizedBox(height: 20),
          Expanded(
            child: ListView(children: [
              ..._motivos.map((m) => RadioListTile<String>(
                value: m,
                groupValue: _motivo,
                activeColor: AppColors.primary,
                title: Text(_labels[m]!),
                onChanged: (v) => setState(() => _motivo = v),
              )),
              const SizedBox(height: 12),
              TextField(
                controller: _descCtrl,
                maxLines: 3,
                style: const TextStyle(color: AppColors.textPrimary),
                decoration: const InputDecoration(
                  hintText: 'Descrição adicional (opcional)',
                  filled: true,
                  fillColor: Color(0xFF242424),
                ),
              ),
            ]),
          ),
          const SizedBox(height: 16),
          KubicoButton(label: 'Enviar denúncia', onPressed: _submit, loading: _loading),
        ]),
      ),
    );
  }
}

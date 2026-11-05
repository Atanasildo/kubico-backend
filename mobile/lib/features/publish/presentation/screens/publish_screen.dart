import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/kubico_button.dart';
import '../../../../shared/widgets/kubico_text_field.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../properties/data/property_repository.dart';

class PublishScreen extends StatefulWidget {
  const PublishScreen({super.key});
  @override
  State<PublishScreen> createState() => _PublishScreenState();
}

class _PublishScreenState extends State<PublishScreen> {
  final _formKey = GlobalKey<FormState>();
  final _repo = PropertyRepository();

  final _tituloCtrl  = TextEditingController();
  final _descCtrl    = TextEditingController();
  final _precoCtrl   = TextEditingController();
  final _areaCtrl    = TextEditingController();
  final _quartosCtrl = TextEditingController(text: '0');
  final _wcCtrl      = TextEditingController(text: '0');
  final _telCtrl     = TextEditingController();
  final _waCtrl      = TextEditingController();

  String _tipoNegocio = 'venda';
  String _tipoImovel  = 'apartamento';
  String _moeda       = 'USD';
  String? _provincia;
  final _municipioCtrl = TextEditingController();

  bool _temEnergia = false;
  bool _temAgua    = false;
  bool _mobilado   = false;
  bool _temQuintal = false;

  bool _submitting = false;
  int _step = 0;

  @override
  void dispose() {
    for (final c in [_tituloCtrl, _descCtrl, _precoCtrl, _areaCtrl,
        _quartosCtrl, _wcCtrl, _telCtrl, _waCtrl, _municipioCtrl]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_provincia == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecciona uma província'), backgroundColor: AppColors.error));
      return;
    }
    setState(() => _submitting = true);
    try {
      await _repo.createProperty({
        'titulo': _tituloCtrl.text.trim(),
        'descricao': _descCtrl.text.trim(),
        'tipo_negocio': _tipoNegocio,
        'tipo_imovel': _tipoImovel,
        'preco': double.tryParse(_precoCtrl.text) ?? 0,
        'moeda': _moeda,
        'provincia': _provincia,
        'municipio': _municipioCtrl.text.trim(),
        'area_m2': double.tryParse(_areaCtrl.text),
        'quartos': int.tryParse(_quartosCtrl.text) ?? 0,
        'casas_banho': int.tryParse(_wcCtrl.text) ?? 0,
        'tem_energia': _temEnergia,
        'tem_agua': _temAgua,
        'mobilado': _mobilado,
        'tem_quintal': _temQuintal,
        'contacto_telefone': _telCtrl.text.isNotEmpty ? _telCtrl.text.trim() : null,
        'contacto_whatsapp': _waCtrl.text.isNotEmpty ? _waCtrl.text.trim() : null,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Anúncio publicado com sucesso!'),
            backgroundColor: AppColors.success));
        _reset();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro: ${e.toString()}'), backgroundColor: AppColors.error));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _reset() {
    _tituloCtrl.clear(); _descCtrl.clear(); _precoCtrl.clear();
    _areaCtrl.clear(); _quartosCtrl.text = '0'; _wcCtrl.text = '0';
    _telCtrl.clear(); _waCtrl.clear(); _municipioCtrl.clear();
    setState(() { _tipoNegocio = 'venda'; _tipoImovel = 'apartamento';
      _moeda = 'USD'; _provincia = null; _step = 0; });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isAuth) {
      return const Scaffold(body: Center(child: Text('Faz login para publicar.')));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Publicar imóvel')),
      body: Form(
        key: _formKey,
        child: Stepper(
          currentStep: _step,
          onStepContinue: () {
            if (_step < 2) setState(() => _step++);
            else _submit();
          },
          onStepCancel: () { if (_step > 0) setState(() => _step--); },
          controlsBuilder: (ctx, details) => Padding(
            padding: const EdgeInsets.only(top: 16),
            child: Row(children: [
              Expanded(child: KubicoButton(
                label: _step == 2 ? 'Publicar anúncio' : 'Continuar',
                onPressed: details.onStepContinue,
                loading: _submitting,
              )),
              if (_step > 0) ...[
                const SizedBox(width: 10),
                Expanded(child: KubicoButton(
                  label: 'Voltar', onPressed: details.onStepCancel, secondary: true)),
              ],
            ]),
          ),
          steps: [
            Step(
              title: const Text('Informações básicas'),
              isActive: _step >= 0,
              state: _step > 0 ? StepState.complete : StepState.indexed,
              content: _Step1(),
            ),
            Step(
              title: const Text('Localização e detalhes'),
              isActive: _step >= 1,
              state: _step > 1 ? StepState.complete : StepState.indexed,
              content: _Step2(),
            ),
            Step(
              title: const Text('Contacto e extras'),
              isActive: _step >= 2,
              content: _Step3(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _Step1() => Column(children: [
    KubicoTextField(label: 'Título do anúncio', controller: _tituloCtrl,
      validator: (v) => (v == null || v.length < 5) ? 'Mínimo 5 caracteres' : null),
    const SizedBox(height: 14),
    _Label('Tipo de negócio'),
    _RowChips(options: const ['venda', 'arrendamento'], selected: _tipoNegocio,
      onSelect: (v) => setState(() => _tipoNegocio = v)),
    const SizedBox(height: 14),
    _Label('Tipo de imóvel'),
    Wrap(spacing: 8, runSpacing: 8, children: AppConstants.tiposImovel.map((t) =>
      _SmallChip(label: t, active: _tipoImovel == t, onTap: () => setState(() => _tipoImovel = t))
    ).toList()),
    const SizedBox(height: 14),
    Row(children: [
      Expanded(child: KubicoTextField(label: 'Preço', controller: _precoCtrl,
        keyboardType: TextInputType.number,
        validator: (v) => (v == null || double.tryParse(v) == null) ? 'Preço inválido' : null)),
      const SizedBox(width: 10),
      DropdownButton<String>(
        value: _moeda,
        dropdownColor: AppColors.surface,
        style: const TextStyle(color: AppColors.textPrimary),
        items: const [DropdownMenuItem(value: 'USD', child: Text('USD')),
          DropdownMenuItem(value: 'AOA', child: Text('AOA'))],
        onChanged: (v) => setState(() => _moeda = v!),
      ),
    ]),
    const SizedBox(height: 14),
    KubicoTextField(label: 'Descrição (opcional)', controller: _descCtrl, maxLines: 4),
  ]);

  Widget _Step2() => Column(children: [
    _Label('Província'),
    DropdownButtonFormField<String>(
      value: _provincia,
      dropdownColor: AppColors.surface,
      hint: const Text('Seleccionar', style: TextStyle(color: AppColors.textHint)),
      style: const TextStyle(color: AppColors.textPrimary),
      items: AppConstants.provincias.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
      onChanged: (v) => setState(() => _provincia = v),
      validator: (v) => v == null ? 'Selecciona a província' : null,
      decoration: const InputDecoration(),
    ),
    const SizedBox(height: 14),
    KubicoTextField(label: 'Município', controller: _municipioCtrl,
      validator: (v) => (v == null || v.isEmpty) ? 'Obrigatório' : null),
    const SizedBox(height: 14),
    KubicoTextField(label: 'Área (m²)', controller: _areaCtrl, keyboardType: TextInputType.number),
    const SizedBox(height: 14),
    Row(children: [
      Expanded(child: KubicoTextField(label: 'Quartos', controller: _quartosCtrl, keyboardType: TextInputType.number)),
      const SizedBox(width: 10),
      Expanded(child: KubicoTextField(label: 'Casas de banho', controller: _wcCtrl, keyboardType: TextInputType.number)),
    ]),
  ]);

  Widget _Step3() => Column(children: [
    KubicoTextField(label: 'Telefone', controller: _telCtrl, keyboardType: TextInputType.phone,
      prefixIcon: Icons.phone_outlined),
    const SizedBox(height: 14),
    KubicoTextField(label: 'WhatsApp', controller: _waCtrl, keyboardType: TextInputType.phone,
      prefixIcon: Icons.chat_outlined),
    const SizedBox(height: 14),
    _Label('Comodidades'),
    CheckboxListTile(
      value: _temEnergia, activeColor: AppColors.primary,
      title: const Text('Energia eléctrica'),
      onChanged: (v) => setState(() => _temEnergia = v!)),
    CheckboxListTile(
      value: _temAgua, activeColor: AppColors.primary,
      title: const Text('Água canalizada'),
      onChanged: (v) => setState(() => _temAgua = v!)),
    CheckboxListTile(
      value: _mobilado, activeColor: AppColors.primary,
      title: const Text('Mobilado'),
      onChanged: (v) => setState(() => _mobilado = v!)),
    CheckboxListTile(
      value: _temQuintal, activeColor: AppColors.primary,
      title: const Text('Quintal'),
      onChanged: (v) => setState(() => _temQuintal = v!)),
  ]);

  Widget _Label(String t) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Align(alignment: Alignment.centerLeft,
      child: Text(t, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary))));

  Widget _RowChips({required List<String> options, required String selected, required void Function(String) onSelect}) =>
    Row(children: options.map((o) => Padding(
      padding: const EdgeInsets.only(right: 8),
      child: _SmallChip(label: o, active: selected == o, onTap: () => onSelect(o)))).toList());
}

class _SmallChip extends StatelessWidget {
  const _SmallChip({required this.label, required this.active, required this.onTap});
  final String label; final bool active; final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: active ? AppColors.primary.withOpacity(0.15) : AppColors.surfaceVariant,
        border: Border.all(color: active ? AppColors.primary : AppColors.border),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(label, style: TextStyle(
        fontSize: 13,
        color: active ? AppColors.primary : AppColors.textSecondary,
        fontWeight: active ? FontWeight.w600 : FontWeight.w400)),
    ),
  );
}

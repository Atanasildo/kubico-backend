import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/kubico_button.dart';
import '../../../../shared/widgets/kubico_text_field.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../properties/data/property_repository.dart';

class PublishScreen extends StatefulWidget {
  const PublishScreen({super.key});
  @override State<PublishScreen> createState() => _PublishScreenState();
}

class _PublishScreenState extends State<PublishScreen> {
  final _repo    = PropertyRepository();
  final _form    = GlobalKey<FormState>();
  final _picker  = ImagePicker();

  final _tituloCtrl  = TextEditingController();
  final _descCtrl    = TextEditingController();
  final _precoCtrl   = TextEditingController();
  final _areaCtrl    = TextEditingController();
  final _quartosCtrl = TextEditingController(text: '0');
  final _wcCtrl      = TextEditingController(text: '0');
  final _salasCtrl   = TextEditingController(text: '0');
  final _cozCtrl     = TextEditingController(text: '0');
  final _garCtrl     = TextEditingController(text: '0');
  final _telCtrl     = TextEditingController();
  final _waCtrl      = TextEditingController();
  final _munCtrl     = TextEditingController();
  final _bairroCtrl  = TextEditingController();
  final _refCtrl     = TextEditingController();

  String  _tipoNegocio = 'venda';
  String  _tipoImovel  = 'apartamento';
  String  _moeda       = 'USD';
  String? _provincia;

  bool _temEnergia  = false;
  bool _temAgua     = false;
  bool _temGerador  = false;
  bool _mobilado    = false;
  bool _temPiscina  = false;
  bool _temQuintal  = false;

  final List<File>   _localImages = [];
  final List<String> _uploadedUrls = [];
  bool _uploading  = false;
  bool _submitting = false;
  int  _step       = 0;

  @override
  void dispose() {
    for (final c in [_tituloCtrl, _descCtrl, _precoCtrl, _areaCtrl, _quartosCtrl, _wcCtrl,
        _salasCtrl, _cozCtrl, _garCtrl, _telCtrl, _waCtrl, _munCtrl, _bairroCtrl, _refCtrl])
      c.dispose();
    super.dispose();
  }

  // ── Imagens ───────────────────────────────────────────────────────────────
  Future<void> _pickImages() async {
    final picked = await _picker.pickMultiImage(imageQuality: 80);
    if (picked.isEmpty) return;
    final files = picked.take(10 - _localImages.length).map((x) => File(x.path)).toList();
    setState(() => _localImages.addAll(files));
  }

  Future<void> _uploadImages() async {
    setState(() => _uploading = true);
    for (final f in _localImages) {
      try {
        final url = await _repo.uploadImage(f.path);
        _uploadedUrls.add(url);
      } catch (_) {}
    }
    setState(() => _uploading = false);
  }

  // ── Submeter ──────────────────────────────────────────────────────────────
  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    if (_provincia == null) {
      _showError('Selecciona uma província.');
      return;
    }
    if (_localImages.isNotEmpty && _uploadedUrls.isEmpty) {
      await _uploadImages();
    }
    setState(() => _submitting = true);
    try {
      await _repo.create({
        'titulo':      _tituloCtrl.text.trim(),
        'descricao':   _descCtrl.text.trim(),
        'tipo_negocio': _tipoNegocio,
        'tipo_imovel':  _tipoImovel,
        'preco':       double.tryParse(_precoCtrl.text) ?? 0,
        'moeda':       _moeda,
        'provincia':   _provincia,
        'municipio':   _munCtrl.text.trim(),
        if (_bairroCtrl.text.isNotEmpty) 'bairro': _bairroCtrl.text.trim(),
        if (_refCtrl.text.isNotEmpty)   'endereco_referencia': _refCtrl.text.trim(),
        if (_areaCtrl.text.isNotEmpty)  'area_m2': double.tryParse(_areaCtrl.text),
        'quartos':     int.tryParse(_quartosCtrl.text) ?? 0,
        'casas_banho': int.tryParse(_wcCtrl.text) ?? 0,
        'salas':       int.tryParse(_salasCtrl.text) ?? 0,
        'cozinhas':    int.tryParse(_cozCtrl.text) ?? 0,
        'garagens':    int.tryParse(_garCtrl.text) ?? 0,
        'tem_energia': _temEnergia, 'tem_agua': _temAgua,
        'tem_gerador': _temGerador, 'mobilado': _mobilado,
        'tem_piscina': _temPiscina, 'tem_quintal': _temQuintal,
        if (_telCtrl.text.isNotEmpty) 'contacto_telefone': _telCtrl.text.trim(),
        if (_waCtrl.text.isNotEmpty)  'contacto_whatsapp': _waCtrl.text.trim(),
        'imagens': _uploadedUrls,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Anúncio publicado com sucesso!'),
            backgroundColor: AppColors.success));
        _reset();
      }
    } catch (_) {
      _showError('Erro ao publicar. Tenta novamente.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _reset() {
    for (final c in [_tituloCtrl, _descCtrl, _precoCtrl, _areaCtrl, _munCtrl, _bairroCtrl, _refCtrl, _telCtrl, _waCtrl])
      c.clear();
    _quartosCtrl.text = _wcCtrl.text = _salasCtrl.text = _cozCtrl.text = _garCtrl.text = '0';
    setState(() {
      _tipoNegocio = 'venda'; _tipoImovel = 'apartamento'; _moeda = 'USD';
      _provincia = null; _step = 0;
      _localImages.clear(); _uploadedUrls.clear();
      _temEnergia = _temAgua = _temGerador = _mobilado = _temPiscina = _temQuintal = false;
    });
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.error));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isAuth) {
      return const Scaffold(body: Center(
        child: Text('Faz login para publicar.', style: TextStyle(color: AppColors.textSecondary))));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Publicar imóvel')),
      body: Form(
        key: _form,
        child: Stepper(
          currentStep: _step,
          onStepContinue: () {
            if (_step < 2) setState(() => _step++);
            else _submit();
          },
          onStepCancel: () { if (_step > 0) setState(() => _step--); },
          controlsBuilder: (ctx, d) => Padding(
            padding: const EdgeInsets.only(top: 16),
            child: Column(children: [
              KubicoButton(
                label: _step == 2
                    ? (_uploading ? 'A carregar imagens…' : 'Publicar anúncio')
                    : 'Continuar',
                onPressed: d.onStepContinue,
                loading: _submitting || _uploading),
              if (_step > 0) ...[
                const SizedBox(height: 10),
                KubicoButton(label: 'Voltar', onPressed: d.onStepCancel, secondary: true),
              ],
            ]),
          ),
          steps: [
            Step(
              title: const Text('Informações básicas'),
              isActive: _step >= 0,
              state: _step > 0 ? StepState.complete : StepState.indexed,
              content: _StepInfo(
                tituloCtrl: _tituloCtrl, descCtrl: _descCtrl,
                precoCtrl: _precoCtrl, areaCtrl: _areaCtrl,
                tipoNegocio: _tipoNegocio, tipoImovel: _tipoImovel, moeda: _moeda,
                onNegocio: (v) => setState(() => _tipoNegocio = v),
                onImovel:  (v) => setState(() => _tipoImovel = v),
                onMoeda:   (v) => setState(() => _moeda = v),
              ),
            ),
            Step(
              title: const Text('Localização e detalhes'),
              isActive: _step >= 1,
              state: _step > 1 ? StepState.complete : StepState.indexed,
              content: _StepLocation(
                provincia: _provincia, munCtrl: _munCtrl,
                bairroCtrl: _bairroCtrl, refCtrl: _refCtrl,
                quartosCtrl: _quartosCtrl, wcCtrl: _wcCtrl,
                salasCtrl: _salasCtrl, cozCtrl: _cozCtrl, garCtrl: _garCtrl,
                onProvincia: (v) => setState(() => _provincia = v),
              ),
            ),
            Step(
              title: const Text('Fotos, contacto e extras'),
              isActive: _step >= 2,
              content: _StepExtras(
                localImages: _localImages, onPickImages: _pickImages,
                telCtrl: _telCtrl, waCtrl: _waCtrl,
                temEnergia: _temEnergia, temAgua: _temAgua,
                temGerador: _temGerador, mobilado: _mobilado,
                temPiscina: _temPiscina, temQuintal: _temQuintal,
                onToggle: (field, v) => setState(() {
                  switch (field) {
                    case 'energia': _temEnergia = v; break;
                    case 'agua':    _temAgua    = v; break;
                    case 'gerador': _temGerador = v; break;
                    case 'mobilado': _mobilado  = v; break;
                    case 'piscina': _temPiscina = v; break;
                    case 'quintal': _temQuintal = v; break;
                  }
                }),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Step widgets ─────────────────────────────────────────────────────────────

class _StepInfo extends StatelessWidget {
  const _StepInfo({
    required this.tituloCtrl, required this.descCtrl,
    required this.precoCtrl, required this.areaCtrl,
    required this.tipoNegocio, required this.tipoImovel, required this.moeda,
    required this.onNegocio, required this.onImovel, required this.onMoeda,
  });
  final TextEditingController tituloCtrl, descCtrl, precoCtrl, areaCtrl;
  final String tipoNegocio, tipoImovel, moeda;
  final void Function(String) onNegocio, onImovel, onMoeda;

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    KubicoTextField(label: 'Título do anúncio', controller: tituloCtrl,
      validator: (v) => (v == null || v.length < 5) ? 'Mínimo 5 caracteres' : null),
    const SizedBox(height: 14),
    _Label('Tipo de negócio'),
    Wrap(spacing: 8, children: ['venda', 'arrendamento'].map((o) => _SmChip(
      label: o, active: tipoNegocio == o, onTap: () => onNegocio(o))).toList()),
    const SizedBox(height: 14),
    _Label('Tipo de imóvel'),
    Wrap(spacing: 8, runSpacing: 8, children: AppConstants.tiposImovel.map((t) => _SmChip(
      label: t, active: tipoImovel == t, onTap: () => onImovel(t))).toList()),
    const SizedBox(height: 14),
    Row(children: [
      Expanded(child: KubicoTextField(label: 'Preço', controller: precoCtrl,
        keyboardType: TextInputType.number,
        validator: (v) => double.tryParse(v ?? '') == null ? 'Preço inválido' : null)),
      const SizedBox(width: 10),
      DropdownButton<String>(
        value: moeda, dropdownColor: AppColors.surface,
        style: const TextStyle(color: AppColors.textPrimary),
        items: const [
          DropdownMenuItem(value: 'USD', child: Text('USD')),
          DropdownMenuItem(value: 'AOA', child: Text('AOA')),
        ],
        onChanged: (v) => onMoeda(v!)),
    ]),
    const SizedBox(height: 10),
    KubicoTextField(label: 'Área (m²)', controller: areaCtrl, keyboardType: TextInputType.number),
    const SizedBox(height: 10),
    KubicoTextField(label: 'Descrição', controller: descCtrl, maxLines: 4),
  ]);
}

class _StepLocation extends StatelessWidget {
  const _StepLocation({
    required this.provincia, required this.onProvincia,
    required this.munCtrl, required this.bairroCtrl, required this.refCtrl,
    required this.quartosCtrl, required this.wcCtrl,
    required this.salasCtrl, required this.cozCtrl, required this.garCtrl,
  });
  final String? provincia;
  final void Function(String?) onProvincia;
  final TextEditingController munCtrl, bairroCtrl, refCtrl,
      quartosCtrl, wcCtrl, salasCtrl, cozCtrl, garCtrl;

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _Label('Província'),
    DropdownButtonFormField<String>(
      value: provincia, dropdownColor: AppColors.surface,
      hint: const Text('Seleccionar', style: TextStyle(color: AppColors.textHint)),
      style: const TextStyle(color: AppColors.textPrimary),
      items: AppConstants.provincias.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
      onChanged: onProvincia,
      validator: (v) => v == null ? 'Obrigatório' : null,
      decoration: const InputDecoration()),
    const SizedBox(height: 10),
    KubicoTextField(label: 'Município', controller: munCtrl,
      validator: (v) => (v == null || v.isEmpty) ? 'Obrigatório' : null),
    const SizedBox(height: 10),
    KubicoTextField(label: 'Bairro (opcional)', controller: bairroCtrl),
    const SizedBox(height: 10),
    KubicoTextField(label: 'Referência de localização (opcional)', controller: refCtrl),
    const SizedBox(height: 14),
    Row(children: [
      Expanded(child: KubicoTextField(label: 'Quartos', controller: quartosCtrl, keyboardType: TextInputType.number)),
      const SizedBox(width: 8),
      Expanded(child: KubicoTextField(label: 'WC',      controller: wcCtrl,      keyboardType: TextInputType.number)),
      const SizedBox(width: 8),
      Expanded(child: KubicoTextField(label: 'Salas',   controller: salasCtrl,   keyboardType: TextInputType.number)),
    ]),
    const SizedBox(height: 10),
    Row(children: [
      Expanded(child: KubicoTextField(label: 'Cozinhas', controller: cozCtrl, keyboardType: TextInputType.number)),
      const SizedBox(width: 8),
      Expanded(child: KubicoTextField(label: 'Garagens', controller: garCtrl, keyboardType: TextInputType.number)),
    ]),
  ]);
}

class _StepExtras extends StatelessWidget {
  const _StepExtras({
    required this.localImages, required this.onPickImages,
    required this.telCtrl, required this.waCtrl,
    required this.temEnergia, required this.temAgua,
    required this.temGerador, required this.mobilado,
    required this.temPiscina, required this.temQuintal,
    required this.onToggle,
  });
  final List<File> localImages;
  final VoidCallback onPickImages;
  final TextEditingController telCtrl, waCtrl;
  final bool temEnergia, temAgua, temGerador, mobilado, temPiscina, temQuintal;
  final void Function(String, bool) onToggle;

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    // Fotos
    _Label('Fotos (máx. 10)'),
    SizedBox(
      height: 90,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          GestureDetector(
            onTap: onPickImages,
            child: Container(
              width: 80, height: 80,
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border)),
              child: const Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.add_a_photo_outlined, color: AppColors.primary, size: 24),
                SizedBox(height: 4),
                Text('Adicionar', style: TextStyle(fontSize: 10, color: AppColors.primary)),
              ]),
            ),
          ),
          ...localImages.map((f) => Container(
            width: 80, height: 80,
            margin: const EdgeInsets.only(right: 8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              image: DecorationImage(image: FileImage(f), fit: BoxFit.cover)),
          )),
        ],
      ),
    ),
    const SizedBox(height: 14),
    KubicoTextField(label: 'Telefone', controller: telCtrl, keyboardType: TextInputType.phone, prefixIcon: Icons.phone_outlined),
    const SizedBox(height: 10),
    KubicoTextField(label: 'WhatsApp', controller: waCtrl,  keyboardType: TextInputType.phone, prefixIcon: Icons.chat_outlined),
    const SizedBox(height: 14),
    _Label('Comodidades'),
    ...[
      ('Energia eléctrica', 'energia', temEnergia),
      ('Água canalizada',   'agua',    temAgua),
      ('Gerador',           'gerador', temGerador),
      ('Mobilado',          'mobilado', mobilado),
      ('Piscina',           'piscina', temPiscina),
      ('Quintal',           'quintal', temQuintal),
    ].map((e) => CheckboxListTile(
      value: e.$3 as bool, activeColor: AppColors.primary,
      title: Text(e.$1 as String), contentPadding: EdgeInsets.zero,
      onChanged: (v) => onToggle(e.$2 as String, v!),
    )),
  ]);
}

class _Label extends StatelessWidget {
  const _Label(this.text);
  final String text;
  @override Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(text, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)));
}

class _SmChip extends StatelessWidget {
  const _SmChip({required this.label, required this.active, required this.onTap});
  final String label; final bool active; final VoidCallback onTap;
  @override Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
      decoration: BoxDecoration(
        color: active ? AppColors.primary.withOpacity(0.15) : AppColors.surfaceVariant,
        border: Border.all(color: active ? AppColors.primary : AppColors.border),
        borderRadius: BorderRadius.circular(8)),
      child: Text(label, style: TextStyle(
        fontSize: 13,
        color: active ? AppColors.primary : AppColors.textSecondary,
        fontWeight: active ? FontWeight.w600 : FontWeight.w400))));
}

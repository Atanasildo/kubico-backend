import 'package:flutter/material.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/kubico_button.dart';
import '../../../../shared/widgets/kubico_text_field.dart';
import '../../data/property_model.dart';
import '../../data/property_repository.dart';

class EditPropertyScreen extends StatefulWidget {
  const EditPropertyScreen({super.key, required this.property});
  final PropertyModel property;
  @override State<EditPropertyScreen> createState() => _EditPropertyScreenState();
}

class _EditPropertyScreenState extends State<EditPropertyScreen> {
  final _repo = PropertyRepository();
  final _form = GlobalKey<FormState>();

  late final _tituloCtrl  = TextEditingController(text: widget.property.titulo);
  late final _descCtrl    = TextEditingController(text: widget.property.descricao ?? '');
  late final _precoCtrl   = TextEditingController(text: widget.property.preco.toStringAsFixed(0));
  late final _areaCtrl    = TextEditingController(text: widget.property.areaM2?.toStringAsFixed(0) ?? '');
  late final _quartosCtrl = TextEditingController(text: '${widget.property.quartos}');
  late final _wcCtrl      = TextEditingController(text: '${widget.property.casasBanho}');
  late final _telCtrl     = TextEditingController(text: widget.property.contactoTelefone ?? '');
  late final _waCtrl      = TextEditingController(text: widget.property.contactoWhatsapp ?? '');
  late final _bairroCtrl  = TextEditingController(text: widget.property.bairro ?? '');
  late final _refCtrl     = TextEditingController(text: widget.property.enderecoReferencia ?? '');
  late final _munCtrl     = TextEditingController(text: widget.property.municipio);
  late final _salasCtrl   = TextEditingController(text: '${widget.property.salas}');
  late final _cozCtrl     = TextEditingController(text: '${widget.property.cozinhas}');
  late final _garCtrl     = TextEditingController(text: '${widget.property.garagens}');

  late String  _tipoNegocio = widget.property.tipoNegocio;
  late String  _tipoImovel  = widget.property.tipoImovel;
  late String  _moeda       = widget.property.moeda;
  late String? _provincia   = widget.property.provincia;
  late bool _temEnergia     = widget.property.temEnergia;
  late bool _temAgua        = widget.property.temAgua;
  late bool _temGerador     = widget.property.temGerador;
  late bool _mobilado       = widget.property.mobilado;
  late bool _temPiscina     = widget.property.temPiscina;
  late bool _temQuintal     = widget.property.temQuintal;

  bool _saving   = false;
  bool _deleting = false;

  @override
  void dispose() {
    for (final c in [_tituloCtrl, _descCtrl, _precoCtrl, _areaCtrl, _quartosCtrl,
        _wcCtrl, _telCtrl, _waCtrl, _bairroCtrl, _refCtrl, _munCtrl, _salasCtrl, _cozCtrl, _garCtrl])
      c.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await _repo.update(widget.property.id, {
        'titulo': _tituloCtrl.text.trim(),
        'descricao': _descCtrl.text.trim(),
        'tipo_negocio': _tipoNegocio,
        'tipo_imovel': _tipoImovel,
        'preco': double.tryParse(_precoCtrl.text) ?? 0,
        'moeda': _moeda,
        'provincia': _provincia,
        'municipio': _munCtrl.text.trim(),
        if (_bairroCtrl.text.isNotEmpty) 'bairro': _bairroCtrl.text.trim(),
        if (_refCtrl.text.isNotEmpty) 'endereco_referencia': _refCtrl.text.trim(),
        if (_areaCtrl.text.isNotEmpty) 'area_m2': double.tryParse(_areaCtrl.text),
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
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Anúncio actualizado.'), backgroundColor: AppColors.success));
        Navigator.pop(context);
      }
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Erro ao actualizar.'), backgroundColor: AppColors.error));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _delete() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Eliminar anúncio'),
        content: const Text('Esta acção é irreversível. Tens a certeza?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(context, true),
            child: const Text('Eliminar', style: TextStyle(color: AppColors.error))),
        ],
      ),
    );
    if (ok != true) return;
    setState(() => _deleting = true);
    try {
      await _repo.delete(widget.property.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Anúncio eliminado.'), backgroundColor: AppColors.success));
        Navigator.pop(context);
      }
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Erro ao eliminar.'), backgroundColor: AppColors.error));
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Editar anúncio'),
        actions: [
          _deleting
              ? const Padding(padding: EdgeInsets.all(14),
                  child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.error)))
              : IconButton(
                  icon: const Icon(Icons.delete_outline, color: AppColors.error),
                  onPressed: _delete),
        ],
      ),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            KubicoTextField(label: 'Título', controller: _tituloCtrl,
              validator: (v) => (v == null || v.length < 5) ? 'Mínimo 5 caracteres' : null),
            const SizedBox(height: 14),
            KubicoTextField(label: 'Descrição', controller: _descCtrl, maxLines: 4),
            const SizedBox(height: 14),

            _Label('Tipo de negócio'),
            _ChipRow(options: const ['venda', 'arrendamento'], selected: _tipoNegocio,
              onSelect: (v) => setState(() => _tipoNegocio = v)),
            const SizedBox(height: 14),

            _Label('Tipo de imóvel'),
            Wrap(spacing: 8, runSpacing: 8, children: AppConstants.tiposImovel.map((t) =>
              _Chip(label: t, active: _tipoImovel == t,
                onTap: () => setState(() => _tipoImovel = t))).toList()),
            const SizedBox(height: 14),

            Row(children: [
              Expanded(child: KubicoTextField(label: 'Preço', controller: _precoCtrl,
                keyboardType: TextInputType.number,
                validator: (v) => double.tryParse(v ?? '') == null ? 'Inválido' : null)),
              const SizedBox(width: 10),
              DropdownButton<String>(
                value: _moeda, dropdownColor: AppColors.surface,
                style: const TextStyle(color: AppColors.textPrimary),
                items: const [
                  DropdownMenuItem(value: 'USD', child: Text('USD')),
                  DropdownMenuItem(value: 'AOA', child: Text('AOA')),
                ],
                onChanged: (v) => setState(() => _moeda = v!)),
            ]),
            const SizedBox(height: 14),

            _Label('Província'),
            DropdownButtonFormField<String>(
              value: _provincia, dropdownColor: AppColors.surface,
              style: const TextStyle(color: AppColors.textPrimary),
              items: AppConstants.provincias.map((p) =>
                DropdownMenuItem(value: p, child: Text(p))).toList(),
              onChanged: (v) => setState(() => _provincia = v),
              validator: (v) => v == null ? 'Obrigatório' : null,
              decoration: const InputDecoration()),
            const SizedBox(height: 14),

            KubicoTextField(label: 'Município', controller: _munCtrl,
              validator: (v) => (v == null || v.isEmpty) ? 'Obrigatório' : null),
            const SizedBox(height: 10),
            KubicoTextField(label: 'Bairro (opcional)', controller: _bairroCtrl),
            const SizedBox(height: 10),
            KubicoTextField(label: 'Referência de localização', controller: _refCtrl),
            const SizedBox(height: 14),

            KubicoTextField(label: 'Área (m²)', controller: _areaCtrl, keyboardType: TextInputType.number),
            const SizedBox(height: 10),
            Row(children: [
              Expanded(child: KubicoTextField(label: 'Quartos',  controller: _quartosCtrl, keyboardType: TextInputType.number)),
              const SizedBox(width: 8),
              Expanded(child: KubicoTextField(label: 'WC',       controller: _wcCtrl,      keyboardType: TextInputType.number)),
              const SizedBox(width: 8),
              Expanded(child: KubicoTextField(label: 'Salas',    controller: _salasCtrl,   keyboardType: TextInputType.number)),
            ]),
            const SizedBox(height: 10),
            Row(children: [
              Expanded(child: KubicoTextField(label: 'Cozinhas', controller: _cozCtrl, keyboardType: TextInputType.number)),
              const SizedBox(width: 8),
              Expanded(child: KubicoTextField(label: 'Garagens', controller: _garCtrl, keyboardType: TextInputType.number)),
            ]),
            const SizedBox(height: 14),

            KubicoTextField(label: 'Telefone', controller: _telCtrl, keyboardType: TextInputType.phone, prefixIcon: Icons.phone_outlined),
            const SizedBox(height: 10),
            KubicoTextField(label: 'WhatsApp', controller: _waCtrl,  keyboardType: TextInputType.phone, prefixIcon: Icons.chat_outlined),
            const SizedBox(height: 14),

            _Label('Comodidades'),
            ...[
              ('Energia eléctrica', _temEnergia, (v) => setState(() => _temEnergia = v!)),
              ('Água canalizada',   _temAgua,    (v) => setState(() => _temAgua = v!)),
              ('Gerador',           _temGerador, (v) => setState(() => _temGerador = v!)),
              ('Mobilado',          _mobilado,   (v) => setState(() => _mobilado = v!)),
              ('Piscina',           _temPiscina, (v) => setState(() => _temPiscina = v!)),
              ('Quintal',           _temQuintal, (v) => setState(() => _temQuintal = v!)),
            ].map((e) => CheckboxListTile(
              value: e.$2 as bool, activeColor: AppColors.primary,
              title: Text(e.$1 as String),
              contentPadding: EdgeInsets.zero,
              onChanged: e.$3 as void Function(bool?)?)),

            const SizedBox(height: 24),
            KubicoButton(label: 'Guardar alterações', onPressed: _save, loading: _saving),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);
  final String text;
  @override Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(text, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)));
}

class _ChipRow extends StatelessWidget {
  const _ChipRow({required this.options, required this.selected, required this.onSelect});
  final List<String> options; final String selected; final void Function(String) onSelect;
  @override Widget build(BuildContext context) => Wrap(
    spacing: 8, children: options.map((o) => _Chip(
      label: o, active: selected == o, onTap: () => onSelect(o))).toList());
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.active, required this.onTap});
  final String label; final bool active; final VoidCallback onTap;
  @override Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
      decoration: BoxDecoration(
        color: active ? AppColors.primary.withOpacity(0.15) : AppColors.surfaceVariant,
        border: Border.all(color: active ? AppColors.primary : AppColors.border),
        borderRadius: BorderRadius.circular(8)),
      child: Text(label, style: TextStyle(
        fontSize: 13,
        color: active ? AppColors.primary : AppColors.textSecondary,
        fontWeight: active ? FontWeight.w600 : FontWeight.w400))));
}

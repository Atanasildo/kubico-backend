import 'package:flutter/material.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/kubico_button.dart';

class FilterSheet extends StatefulWidget {
  const FilterSheet({
    super.key,
    this.currentNegocio,
    this.currentProvincia,
    this.currentTipoImovel,
    this.currentQuartosMin,
    this.currentPrecoMax,
    required this.onApply,
  });

  final String? currentNegocio;
  final String? currentProvincia;
  final String? currentTipoImovel;
  final int?    currentQuartosMin;
  final double? currentPrecoMax;
  final void Function({
    String? negocio, String? provincia, String? tipoImovel,
    int? quartosMin, double? precoMax,
  }) onApply;

  @override State<FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<FilterSheet> {
  String? _negocio;
  String? _provincia;
  String? _tipoImovel;
  int?    _quartosMin;
  double? _precoMax;
  final _precoCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _negocio    = widget.currentNegocio;
    _provincia  = widget.currentProvincia;
    _tipoImovel = widget.currentTipoImovel;
    _quartosMin = widget.currentQuartosMin;
    _precoMax   = widget.currentPrecoMax;
    if (_precoMax != null) _precoCtrl.text = _precoMax!.toStringAsFixed(0);
  }

  @override
  void dispose() { _precoCtrl.dispose(); super.dispose(); }

  void _clear() => setState(() {
    _negocio = null; _provincia = null; _tipoImovel = null;
    _quartosMin = null; _precoMax = null; _precoCtrl.clear();
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24, right: 24, top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24),
      child: SingleChildScrollView(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
          // Header
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('Filtros', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            TextButton(onPressed: _clear,
              child: const Text('Limpar tudo', style: TextStyle(color: AppColors.primary))),
          ]),
          const Divider(height: 20),

          // Tipo de negócio
          _Label('Tipo de negócio'),
          Row(children: [
            _Chip(label: 'Venda',        active: _negocio == 'venda',
              onTap: () => setState(() => _negocio = _negocio == 'venda' ? null : 'venda')),
            const SizedBox(width: 10),
            _Chip(label: 'Arrendamento', active: _negocio == 'arrendamento',
              onTap: () => setState(() => _negocio = _negocio == 'arrendamento' ? null : 'arrendamento')),
          ]),
          const SizedBox(height: 18),

          // Tipo de imóvel
          _Label('Tipo de imóvel'),
          Wrap(spacing: 8, runSpacing: 8, children: AppConstants.tiposImovel.map((t) => _Chip(
            label: t, active: _tipoImovel == t,
            onTap: () => setState(() => _tipoImovel = _tipoImovel == t ? null : t),
          )).toList()),
          const SizedBox(height: 18),

          // Quartos mínimos
          _Label('Quartos mínimos'),
          Row(children: [null, 1, 2, 3, 4, 5].map((q) => Padding(
            padding: const EdgeInsets.only(right: 8),
            child: _Chip(
              label: q == null ? 'Todos' : '${q}+',
              active: _quartosMin == q,
              onTap: () => setState(() => _quartosMin = q),
            ),
          )).toList()),
          const SizedBox(height: 18),

          // Província
          _Label('Província'),
          DropdownButtonFormField<String>(
            value: _provincia,
            dropdownColor: AppColors.surface,
            hint: const Text('Todas', style: TextStyle(color: AppColors.textHint)),
            style: const TextStyle(color: AppColors.textPrimary),
            items: [
              const DropdownMenuItem(value: null, child: Text('Todas')),
              ...AppConstants.provincias.map((p) => DropdownMenuItem(value: p, child: Text(p))),
            ],
            onChanged: (v) => setState(() => _provincia = v),
            decoration: const InputDecoration(),
          ),
          const SizedBox(height: 18),

          // Preço máximo
          _Label('Preço máximo (USD)'),
          TextFormField(
            controller: _precoCtrl,
            keyboardType: TextInputType.number,
            style: const TextStyle(color: AppColors.textPrimary),
            decoration: const InputDecoration(hintText: 'Sem limite'),
            onChanged: (v) => _precoMax = double.tryParse(v),
          ),
          const SizedBox(height: 24),

          KubicoButton(
            label: 'Aplicar filtros',
            onPressed: () {
              Navigator.pop(context);
              widget.onApply(
                negocio:   _negocio,
                provincia: _provincia,
                tipoImovel: _tipoImovel,
                quartosMin: _quartosMin,
                precoMax:   _precoMax,
              );
            },
          ),
        ]),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Text(text, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w500)));
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.active, required this.onTap});
  final String label; final bool active; final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
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

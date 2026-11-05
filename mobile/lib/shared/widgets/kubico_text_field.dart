import 'package:flutter/material.dart';

class KubicoTextField extends StatefulWidget {
  const KubicoTextField({
    super.key,
    required this.label,
    this.hint,
    this.controller,
    this.obscure = false,
    this.keyboardType,
    this.validator,
    this.prefixIcon,
    this.onChanged,
    this.enabled = true,
    this.maxLines = 1,
  });

  final String label;
  final String? hint;
  final TextEditingController? controller;
  final bool obscure;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final IconData? prefixIcon;
  final void Function(String)? onChanged;
  final bool enabled;
  final int? maxLines;

  @override
  State<KubicoTextField> createState() => _KubicoTextFieldState();
}

class _KubicoTextFieldState extends State<KubicoTextField> {
  late bool _obscured;

  @override
  void initState() {
    super.initState();
    _obscured = widget.obscure;
  }

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: widget.controller,
      obscureText: _obscured,
      keyboardType: widget.keyboardType,
      validator: widget.validator,
      onChanged: widget.onChanged,
      enabled: widget.enabled,
      maxLines: widget.obscure ? 1 : widget.maxLines,
      style: const TextStyle(color: Color(0xFFF5F5F5)),
      decoration: InputDecoration(
        labelText: widget.label,
        hintText: widget.hint,
        labelStyle: const TextStyle(color: Color(0xFF9E9E9E)),
        prefixIcon: widget.prefixIcon != null
            ? Icon(widget.prefixIcon, color: const Color(0xFF9E9E9E), size: 20)
            : null,
        suffixIcon: widget.obscure
            ? IconButton(
                icon: Icon(
                  _obscured ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  color: const Color(0xFF9E9E9E),
                  size: 20,
                ),
                onPressed: () => setState(() => _obscured = !_obscured),
              )
            : null,
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class KubicoButton extends StatelessWidget {
  const KubicoButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.loading = false,
    this.secondary = false,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final bool secondary;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    if (secondary) {
      return OutlinedButton(
        onPressed: loading ? null : onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: const BorderSide(color: AppColors.primary),
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: _child(),
      );
    }
    return ElevatedButton(
      onPressed: loading ? null : onPressed,
      child: _child(),
    );
  }

  Widget _child() => loading
      ? const SizedBox(
          width: 22, height: 22,
          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
        )
      : Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[Icon(icon, size: 18), const SizedBox(width: 8)],
            Text(label),
          ],
        );
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/kubico_button.dart';
import '../../../../shared/widgets/kubico_text_field.dart';
import '../providers/auth_provider.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailCtrl = TextEditingController();
  final _telCtrl   = TextEditingController();
  final _codigoCtrl  = TextEditingController();
  final _novaSenhaCtrl = TextEditingController();
  final _form = GlobalKey<FormState>();

  bool _byPhone = false;
  bool _codeSent = false;

  @override void dispose() { _emailCtrl.dispose(); _telCtrl.dispose(); _codigoCtrl.dispose(); _novaSenhaCtrl.dispose(); super.dispose(); }

  Future<void> _send() async {
    if (!_form.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    bool ok;
    if (_byPhone) {
      ok = await auth.forgotPasswordPhone(_telCtrl.text.trim());
    } else {
      ok = await auth.forgotPassword(_emailCtrl.text.trim());
    }
    if (ok && mounted) {
      if (_byPhone) {
        setState(() => _codeSent = true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Se o email existir, receberá instruções.'), backgroundColor: AppColors.success));
        Navigator.pop(context);
      }
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error ?? 'Erro.'), backgroundColor: AppColors.error));
    }
  }

  Future<void> _resetByPhone() async {
    if (!_form.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final ok = await auth.resetPasswordPhone(
      telefone: _telCtrl.text.trim(),
      codigo: _codigoCtrl.text.trim(),
      novaSenha: _novaSenhaCtrl.text,
    );
    if (ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Senha alterada com sucesso!'), backgroundColor: AppColors.success));
      Navigator.popUntil(context, (r) => r.isFirst);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error ?? 'Código inválido.'), backgroundColor: AppColors.error));
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Recuperar senha')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _form,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Como queres recuperar?',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 16),
            Row(children: [
              _TabChip(label: 'Por email', active: !_byPhone, onTap: () => setState(() { _byPhone = false; _codeSent = false; })),
              const SizedBox(width: 10),
              _TabChip(label: 'Por telefone', active: _byPhone,  onTap: () => setState(() { _byPhone = true;  _codeSent = false; })),
            ]),
            const SizedBox(height: 24),

            if (!_codeSent) ...[
              if (!_byPhone)
                KubicoTextField(label: 'Email', controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: Icons.email_outlined,
                  validator: (v) => (v == null || !v.contains('@')) ? 'Email inválido' : null)
              else
                KubicoTextField(label: 'Número de telefone', controller: _telCtrl,
                  keyboardType: TextInputType.phone,
                  prefixIcon: Icons.phone_outlined,
                  validator: (v) => (v == null || v.length < 9) ? 'Número inválido' : null),
              const SizedBox(height: 24),
              KubicoButton(label: 'Enviar código', onPressed: _send, loading: auth.loading),
            ] else ...[
              // Fase de reset com OTP
              const Text('Código enviado por SMS. Insere o código e a nova senha.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
              const SizedBox(height: 20),
              KubicoTextField(label: 'Código OTP', controller: _codigoCtrl,
                keyboardType: TextInputType.number,
                prefixIcon: Icons.lock_clock_outlined,
                validator: (v) => (v == null || v.isEmpty) ? 'Obrigatório' : null),
              const SizedBox(height: 14),
              KubicoTextField(label: 'Nova senha', controller: _novaSenhaCtrl,
                obscure: true, prefixIcon: Icons.lock_outlined,
                validator: (v) => (v == null || v.length < 8) ? 'Mínimo 8 caracteres' : null),
              const SizedBox(height: 24),
              KubicoButton(label: 'Redefinir senha', onPressed: _resetByPhone, loading: auth.loading),
              const SizedBox(height: 10),
              KubicoButton(label: 'Reenviar código', onPressed: _send, secondary: true),
            ],
          ]),
        ),
      ),
    );
  }
}

class _TabChip extends StatelessWidget {
  const _TabChip({required this.label, required this.active, required this.onTap});
  final String label; final bool active; final VoidCallback onTap;
  @override Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: active ? AppColors.primary.withOpacity(0.15) : AppColors.surfaceVariant,
        border: Border.all(color: active ? AppColors.primary : AppColors.border),
        borderRadius: BorderRadius.circular(8)),
      child: Text(label, style: TextStyle(
        fontSize: 13,
        color: active ? AppColors.primary : AppColors.textSecondary,
        fontWeight: active ? FontWeight.w600 : FontWeight.w400))));
}

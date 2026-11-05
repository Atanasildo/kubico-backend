import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/kubico_button.dart';
import '../../../../shared/widgets/kubico_text_field.dart';
import '../providers/auth_provider.dart';
import 'forgot_password_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _form      = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _senhaCtrl = TextEditingController();

  @override void dispose() { _emailCtrl.dispose(); _senhaCtrl.dispose(); super.dispose(); }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final ok = await auth.login(email: _emailCtrl.text.trim(), senha: _senhaCtrl.text);
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error ?? 'Erro ao entrar.'), backgroundColor: AppColors.error));
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Form(
            key: _form,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const SizedBox(height: 32),
              Row(children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.home_rounded, color: Colors.white, size: 22)),
                const SizedBox(width: 10),
                const Text('kubico', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700, letterSpacing: -0.5)),
              ]),
              const SizedBox(height: 48),
              const Text('Bem-vindo de volta',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              const Text('Entra na tua conta para continuar',
                style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
              const SizedBox(height: 36),
              KubicoTextField(
                label: 'Email', controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                prefixIcon: Icons.email_outlined,
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Insere o teu email';
                  if (!v.contains('@')) return 'Email inválido';
                  return null;
                }),
              const SizedBox(height: 16),
              KubicoTextField(
                label: 'Senha', controller: _senhaCtrl, obscure: true,
                prefixIcon: Icons.lock_outlined,
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Insere a tua senha';
                  if (v.length < 8) return 'Mínimo 8 caracteres';
                  return null;
                }),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const ForgotPasswordScreen())),
                  child: const Text('Esqueceste a senha?',
                    style: TextStyle(color: AppColors.primary, fontSize: 13)))),
              const SizedBox(height: 20),
              KubicoButton(label: 'Entrar', onPressed: _submit, loading: auth.loading),
              const SizedBox(height: 32),
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                const Text('Ainda não tens conta?',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                TextButton(
                  onPressed: () => Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const RegisterScreen())),
                  child: const Text('Regista-te',
                    style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600))),
              ]),
            ]),
          ),
        ),
      ),
    );
  }
}

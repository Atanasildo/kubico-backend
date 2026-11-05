import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/kubico_button.dart';
import '../../../../shared/widgets/kubico_text_field.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});
  @override State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _form       = GlobalKey<FormState>();
  final _atualCtrl  = TextEditingController();
  final _novaCtrl   = TextEditingController();
  final _confCtrl   = TextEditingController();

  @override void dispose() { _atualCtrl.dispose(); _novaCtrl.dispose(); _confCtrl.dispose(); super.dispose(); }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final ok = await auth.changePassword(
      senhaAtual: _atualCtrl.text,
      senhaNova:  _novaCtrl.text,
    );
    if (!mounted) return;
    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Senha alterada. Faz login novamente.'),
          backgroundColor: AppColors.success));
      await auth.logout();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error ?? 'Erro.'), backgroundColor: AppColors.error));
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Alterar senha')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Form(key: _form, child: Column(children: [
          KubicoTextField(label: 'Senha actual', controller: _atualCtrl, obscure: true,
            prefixIcon: Icons.lock_outlined,
            validator: (v) => (v == null || v.isEmpty) ? 'Obrigatório' : null),
          const SizedBox(height: 14),
          KubicoTextField(label: 'Nova senha', controller: _novaCtrl, obscure: true,
            prefixIcon: Icons.lock_reset,
            validator: (v) {
              if (v == null || v.length < 8) return 'Mínimo 8 caracteres';
              if (!RegExp(r'^(?=.*[A-Za-z])(?=.*\d)').hasMatch(v)) return 'Inclui letras e números';
              return null;
            }),
          const SizedBox(height: 14),
          KubicoTextField(label: 'Confirmar nova senha', controller: _confCtrl, obscure: true,
            prefixIcon: Icons.lock_outlined,
            validator: (v) => v != _novaCtrl.text ? 'As senhas não coincidem' : null),
          const SizedBox(height: 28),
          KubicoButton(label: 'Alterar senha', onPressed: _submit, loading: auth.loading),
        ])),
      ),
    );
  }
}

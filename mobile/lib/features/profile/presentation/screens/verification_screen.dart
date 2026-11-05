import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/kubico_button.dart';
import '../../../../shared/widgets/kubico_text_field.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class VerificationScreen extends StatefulWidget {
  const VerificationScreen({super.key, required this.canal});
  final String canal; // 'email' | 'telefone'
  @override State<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends State<VerificationScreen> {
  final _codigoCtrl = TextEditingController();
  bool _codeSent    = false;

  @override void dispose() { _codigoCtrl.dispose(); super.dispose(); }

  Future<void> _request() async {
    final auth = context.read<AuthProvider>();
    final ok = await auth.requestVerification(widget.canal);
    if (!mounted) return;
    if (ok) {
      setState(() => _codeSent = true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Código enviado.'), backgroundColor: AppColors.success));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error ?? 'Erro.'), backgroundColor: AppColors.error));
    }
  }

  Future<void> _verify() async {
    final auth = context.read<AuthProvider>();
    final ok = await auth.verifyCode(widget.canal, _codigoCtrl.text.trim());
    if (!mounted) return;
    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${widget.canal == "email" ? "Email" : "Telefone"} verificado com sucesso!'),
          backgroundColor: AppColors.success));
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error ?? 'Código inválido.'), backgroundColor: AppColors.error));
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth  = context.watch<AuthProvider>();
    final label = widget.canal == 'email' ? 'email' : 'telefone';
    return Scaffold(
      appBar: AppBar(title: Text('Verificar $label')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(
            _codeSent
                ? 'Insere o código enviado para o teu $label.'
                : 'Clica no botão abaixo para receber o código de verificação no teu $label.',
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 14)),
          const SizedBox(height: 24),
          if (_codeSent) ...[
            KubicoTextField(
              label: 'Código de verificação',
              controller: _codigoCtrl,
              keyboardType: TextInputType.number,
              prefixIcon: Icons.lock_clock_outlined,
              validator: (v) => (v == null || v.isEmpty) ? 'Obrigatório' : null),
            const SizedBox(height: 20),
            KubicoButton(label: 'Verificar', onPressed: _verify, loading: auth.loading),
            const SizedBox(height: 10),
            KubicoButton(label: 'Reenviar código', onPressed: _request, secondary: true),
          ] else
            KubicoButton(
              label: 'Enviar código de verificação',
              onPressed: _request,
              loading: auth.loading),
        ]),
      ),
    );
  }
}

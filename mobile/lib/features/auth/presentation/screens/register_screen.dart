import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/kubico_button.dart';
import '../../../../shared/widgets/kubico_text_field.dart';
import '../providers/auth_provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey  = GlobalKey<FormState>();
  final _nomeCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _telCtrl  = TextEditingController();
  final _senhaCtrl = TextEditingController();
  final _confirmaCtrl = TextEditingController();
  final _empresaCtrl  = TextEditingController();

  String _role = 'particular';

  @override
  void dispose() {
    for (final c in [_nomeCtrl, _emailCtrl, _telCtrl, _senhaCtrl, _confirmaCtrl, _empresaCtrl]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final ok = await auth.register(
      nome: _nomeCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      senha: _senhaCtrl.text,
      telefone: _telCtrl.text.isNotEmpty ? _telCtrl.text.trim() : null,
      role: _role,
      nomeEmpresa: _role == 'agente' && _empresaCtrl.text.isNotEmpty
          ? _empresaCtrl.text.trim() : null,
    );
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error ?? 'Erro ao registar.'), backgroundColor: AppColors.error));
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Criar conta')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Preenche os teus dados',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
              const Text('Cria a tua conta gratuitamente',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
              const SizedBox(height: 28),

              // Tipo de conta
              const Text('Tipo de conta', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
              const SizedBox(height: 8),
              Row(children: [
                _RoleChip(label: 'Particular', value: 'particular', selected: _role,
                  onTap: () => setState(() => _role = 'particular')),
                const SizedBox(width: 10),
                _RoleChip(label: 'Agente / Empresa', value: 'agente', selected: _role,
                  onTap: () => setState(() => _role = 'agente')),
              ]),
              const SizedBox(height: 20),

              KubicoTextField(label: 'Nome completo', controller: _nomeCtrl,
                prefixIcon: Icons.person_outline,
                validator: (v) => (v == null || v.length < 2) ? 'Nome obrigatório' : null),
              const SizedBox(height: 14),
              KubicoTextField(label: 'Email', controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                prefixIcon: Icons.email_outlined,
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Email obrigatório';
                  if (!v.contains('@')) return 'Email inválido';
                  return null;
                }),
              const SizedBox(height: 14),
              KubicoTextField(label: 'Telefone (opcional)', controller: _telCtrl,
                keyboardType: TextInputType.phone, prefixIcon: Icons.phone_outlined),
              if (_role == 'agente') ...[
                const SizedBox(height: 14),
                KubicoTextField(label: 'Nome da empresa', controller: _empresaCtrl,
                  prefixIcon: Icons.business_outlined),
              ],
              const SizedBox(height: 14),
              KubicoTextField(label: 'Senha', controller: _senhaCtrl,
                obscure: true, prefixIcon: Icons.lock_outlined,
                validator: (v) {
                  if (v == null || v.length < 8) return 'Mínimo 8 caracteres';
                  if (!RegExp(r'^(?=.*[A-Za-z])(?=.*\d)').hasMatch(v))
                    return 'Inclui letras e números';
                  return null;
                }),
              const SizedBox(height: 14),
              KubicoTextField(label: 'Confirmar senha', controller: _confirmaCtrl,
                obscure: true, prefixIcon: Icons.lock_outlined,
                validator: (v) => v != _senhaCtrl.text ? 'As senhas não coincidem' : null),
              const SizedBox(height: 28),
              KubicoButton(label: 'Criar conta', onPressed: _submit, loading: auth.loading),
              const SizedBox(height: 20),
              Center(
                child: TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Já tens conta? Entra aqui',
                    style: TextStyle(color: AppColors.primary)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleChip extends StatelessWidget {
  const _RoleChip({required this.label, required this.value, required this.selected, required this.onTap});
  final String label, value, selected;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final active = value == selected;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: active ? AppColors.primary.withOpacity(0.15) : AppColors.surfaceVariant,
          border: Border.all(color: active ? AppColors.primary : AppColors.border),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(label,
          style: TextStyle(
            color: active ? AppColors.primary : AppColors.textSecondary,
            fontWeight: active ? FontWeight.w600 : FontWeight.w400,
            fontSize: 13,
          )),
      ),
    );
  }
}

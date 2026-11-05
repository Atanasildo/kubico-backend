import 'dart:io';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../features/auth/data/auth_repository.dart';
import '../../../../shared/widgets/kubico_button.dart';
import '../../../../shared/widgets/kubico_text_field.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});
  @override State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _repo     = AuthRepository();
  final _picker   = ImagePicker();

  late final _nomeCtrl    = TextEditingController();
  late final _telCtrl     = TextEditingController();
  late final _empresaCtrl = TextEditingController();
  late final _munCtrl     = TextEditingController();

  String? _provincia;
  File?   _newPhoto;
  bool    _saving = false;

  @override
  void initState() {
    super.initState();
    final u = context.read<AuthProvider>().user;
    if (u != null) {
      _nomeCtrl.text    = u.nome;
      _telCtrl.text     = u.telefone ?? '';
      _empresaCtrl.text = u.nomeEmpresa ?? '';
      _munCtrl.text     = u.municipio ?? '';
      _provincia        = u.provincia;
    }
  }

  @override void dispose() { _nomeCtrl.dispose(); _telCtrl.dispose(); _empresaCtrl.dispose(); _munCtrl.dispose(); super.dispose(); }

  Future<void> _pickPhoto() async {
    final x = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (x != null) setState(() => _newPhoto = File(x.path));
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      String? fotoUrl;
      if (_newPhoto != null) {
        fotoUrl = await _repo.uploadProfilePhoto(_newPhoto!.path);
      }
      final ok = await context.read<AuthProvider>().updateProfile({
        'nome': _nomeCtrl.text.trim(),
        if (_telCtrl.text.isNotEmpty) 'telefone': _telCtrl.text.trim(),
        if (_empresaCtrl.text.isNotEmpty) 'nome_empresa': _empresaCtrl.text.trim(),
        if (_munCtrl.text.isNotEmpty) 'municipio': _munCtrl.text.trim(),
        if (_provincia != null) 'provincia': _provincia,
        if (fotoUrl != null) 'foto_perfil_url': fotoUrl,
      });
      if (ok && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Perfil actualizado.'), backgroundColor: AppColors.success));
        Navigator.pop(context);
      } else if (mounted) {
        final err = context.read<AuthProvider>().error;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(err ?? 'Erro.'), backgroundColor: AppColors.error));
      }
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Erro ao actualizar.'), backgroundColor: AppColors.error));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    return Scaffold(
      appBar: AppBar(title: const Text('Editar perfil')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Avatar
          Center(
            child: Stack(
              children: [
                CircleAvatar(
                  radius: 48,
                  backgroundColor: AppColors.primary,
                  backgroundImage: _newPhoto != null
                      ? FileImage(_newPhoto!) as ImageProvider
                      : (user?.fotoPerfil != null ? CachedNetworkImageProvider(user!.fotoPerfil!) : null),
                  child: (user?.fotoPerfil == null && _newPhoto == null)
                      ? Text(user?.nome.isNotEmpty == true ? user!.nome[0].toUpperCase() : 'K',
                          style: const TextStyle(fontSize: 32, color: Colors.white, fontWeight: FontWeight.w700))
                      : null,
                ),
                Positioned(bottom: 0, right: 0,
                  child: GestureDetector(
                    onTap: _pickPhoto,
                    child: Container(
                      width: 32, height: 32,
                      decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                      child: const Icon(Icons.camera_alt, size: 16, color: Colors.white)))),
              ],
            ),
          ),
          const SizedBox(height: 28),

          KubicoTextField(label: 'Nome completo', controller: _nomeCtrl,
            prefixIcon: Icons.person_outline,
            validator: (v) => (v == null || v.length < 2) ? 'Obrigatório' : null),
          const SizedBox(height: 14),
          KubicoTextField(label: 'Telefone', controller: _telCtrl,
            keyboardType: TextInputType.phone, prefixIcon: Icons.phone_outlined),
          if (user?.isAgente == true) ...[
            const SizedBox(height: 14),
            KubicoTextField(label: 'Nome da empresa', controller: _empresaCtrl,
              prefixIcon: Icons.business_outlined),
          ],
          const SizedBox(height: 14),
          const Text('Localização', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _provincia,
            dropdownColor: AppColors.surface,
            hint: const Text('Província', style: TextStyle(color: AppColors.textHint)),
            style: const TextStyle(color: AppColors.textPrimary),
            items: AppConstants.provincias.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
            onChanged: (v) => setState(() => _provincia = v),
            decoration: const InputDecoration()),
          const SizedBox(height: 10),
          KubicoTextField(label: 'Município', controller: _munCtrl),
          const SizedBox(height: 28),
          KubicoButton(label: 'Guardar', onPressed: _save, loading: _saving),
        ],
      ),
    );
  }
}

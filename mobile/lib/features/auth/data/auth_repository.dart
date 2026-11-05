import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/storage/token_storage.dart';
import 'user_model.dart';

class AuthRepository {
  final Dio _dio = ApiClient.instance.dio;
  final TokenStorage _storage = TokenStorage.instance;

  Future<UserModel> login({required String email, required String senha}) async {
    final res = await _dio.post(ApiEndpoints.login,
      data: {'email': email, 'senha': senha});
    final access  = res.data['access_token']  as String;
    final refresh = res.data['refresh_token'] as String;
    await _storage.saveTokens(access: access, refresh: refresh);
    return fetchMeWithToken(access);
  }

  Future<UserModel> register({
    required String nome,
    required String email,
    required String senha,
    String? telefone,
    String role = 'particular',
    String? nomeEmpresa,
  }) async {
    final res = await _dio.post(ApiEndpoints.register, data: {
      'nome': nome,
      'email': email,
      'senha': senha,
      if (telefone != null && telefone.isNotEmpty) 'telefone': telefone,
      'role': role,
      if (nomeEmpresa != null && nomeEmpresa.isNotEmpty) 'nome_empresa': nomeEmpresa,
    });
    final access  = res.data['access_token']  as String;
    final refresh = res.data['refresh_token'] as String;
    await _storage.saveTokens(access: access, refresh: refresh);
    return fetchMeWithToken(access);
  }

  Future<UserModel> fetchMe() async {
    final res = await _dio.get(ApiEndpoints.me);
    return UserModel.fromJson(res.data);
  }

  /// Fetch /me with an explicit token — bypasses the storage read race on web.
  Future<UserModel> fetchMeWithToken(String token) async {
    final res = await _dio.get(ApiEndpoints.me,
      options: Options(headers: {'Authorization': 'Bearer $token'}));
    return UserModel.fromJson(res.data);
  }

  Future<UserModel?> tryRestoreSession() async {
    try { return await fetchMe(); } catch (_) { return null; }
  }

  Future<void> logout() => ApiClient.instance.logout();

  Future<void> forgotPassword(String email) async {
    await _dio.post(ApiEndpoints.forgotPassword,
      data: {'email': email});
  }

  Future<void> forgotPasswordPhone(String telefone) async {
    await _dio.post(ApiEndpoints.forgotPasswordPhone,
      data: {'telefone': telefone});
  }

  Future<void> resetPasswordPhone({
    required String telefone,
    required String codigo,
    required String novaSenha,
  }) async {
    await _dio.post(ApiEndpoints.resetPasswordPhone, data: {
      'telefone': telefone,
      'codigo': codigo,
      'nova_senha': novaSenha,
    });
  }

  Future<void> changePassword({
    required String senhaAtual,
    required String senhaNova,
  }) async {
    await _dio.post(ApiEndpoints.changePassword, data: {
      'senha_atual': senhaAtual,
      'senha_nova': senhaNova,
    });
  }

  Future<void> requestVerification(String canal) async {
    await _dio.post(ApiEndpoints.requestVerification,
      data: {'canal': canal});
  }

  Future<void> verifyCode(String canal, String codigo) async {
    await _dio.post(ApiEndpoints.verifyCode,
      data: {'canal': canal, 'codigo': codigo});
  }

  Future<UserModel> updateProfile(Map<String, dynamic> data) async {
    final res = await _dio.put(ApiEndpoints.updateMe, data: data);
    return UserModel.fromJson(res.data);
  }

  Future<String> uploadProfilePhoto(String filePath) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath),
    });
    final res = await _dio.post(ApiEndpoints.uploadProfile,
      data: formData,
      options: Options(contentType: 'multipart/form-data'));
    return res.data['url'];
  }
}

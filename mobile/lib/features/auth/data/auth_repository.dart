import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/storage/token_storage.dart';
import 'user_model.dart';

class AuthRepository {
  final Dio _dio = ApiClient.instance.dio;
  final TokenStorage _storage = TokenStorage.instance;

  Future<UserModel> login({required String email, required String senha}) async {
    final res = await _dio.post(ApiEndpoints.login, data: {
      'email': email,
      'senha': senha,
    });
    await _storage.saveTokens(
      access: res.data['access_token'],
      refresh: res.data['refresh_token'],
    );
    return _fetchMe();
  }

  Future<UserModel> register({
    required String nome,
    required String email,
    required String senha,
    String? telefone,
    String role = 'particular',
    String? nomeEmpresa,
  }) async {
    await _dio.post(ApiEndpoints.register, data: {
      'nome': nome,
      'email': email,
      'senha': senha,
      if (telefone != null) 'telefone': telefone,
      'role': role,
      if (nomeEmpresa != null) 'nome_empresa': nomeEmpresa,
    });
    return login(email: email, senha: senha);
  }

  Future<UserModel> _fetchMe() async {
    final res = await _dio.get(ApiEndpoints.me);
    return UserModel.fromJson(res.data);
  }

  Future<UserModel?> tryRestoreSession() async {
    try {
      return await _fetchMe();
    } catch (_) {
      return null;
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post(ApiEndpoints.logout);
    } catch (_) {}
    await _storage.clear();
  }
}

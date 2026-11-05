import 'package:dio/dio.dart';
import '../constants/app_constants.dart';
import '../storage/token_storage.dart';

class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  late final Dio _dio;
  final TokenStorage _storage = TokenStorage.instance;

  void init() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConstants.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.getAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final refreshed = await _refreshToken();
          if (refreshed) {
            final retry = error.requestOptions;
            final token = await _storage.getAccessToken();
            retry.headers['Authorization'] = 'Bearer $token';
            final response = await _dio.fetch(retry);
            return handler.resolve(response);
          }
        }
        return handler.next(error);
      },
    ));
  }

  Future<bool> _refreshToken() async {
    try {
      final refresh = await _storage.getRefreshToken();
      if (refresh == null) return false;
      final res = await _dio.post('/auth/refresh', data: {'refresh_token': refresh});
      await _storage.saveTokens(
        access: res.data['access_token'],
        refresh: res.data['refresh_token'],
      );
      return true;
    } catch (_) {
      await _storage.clear();
      return false;
    }
  }

  Dio get dio => _dio;
}

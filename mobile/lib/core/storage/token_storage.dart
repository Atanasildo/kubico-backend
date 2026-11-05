import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';

class TokenStorage {
  TokenStorage._();
  static final TokenStorage instance = TokenStorage._();

  final _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  Future<void> saveTokens({required String access, required String refresh}) async {
    await Future.wait([
      _storage.write(key: AppConstants.accessTokenKey, value: access),
      _storage.write(key: AppConstants.refreshTokenKey, value: refresh),
    ]);
  }

  Future<String?> getAccessToken()  => _storage.read(key: AppConstants.accessTokenKey);
  Future<String?> getRefreshToken() => _storage.read(key: AppConstants.refreshTokenKey);

  Future<void> clear() async {
    await Future.wait([
      _storage.delete(key: AppConstants.accessTokenKey),
      _storage.delete(key: AppConstants.refreshTokenKey),
      _storage.delete(key: AppConstants.userKey),
    ]);
  }
}

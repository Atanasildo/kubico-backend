import 'package:flutter/foundation.dart';
import '../../data/auth_repository.dart';
import '../../data/user_model.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthProvider extends ChangeNotifier {
  final AuthRepository _repo = AuthRepository();

  AuthStatus _status = AuthStatus.unknown;
  UserModel? _user;
  String? _error;
  bool _loading = false;

  AuthStatus get status  => _status;
  UserModel?  get user   => _user;
  String?     get error  => _error;
  bool        get loading => _loading;
  bool        get isAuth  => _status == AuthStatus.authenticated;

  Future<void> init() async {
    final user = await _repo.tryRestoreSession();
    _user   = user;
    _status = user != null ? AuthStatus.authenticated : AuthStatus.unauthenticated;
    notifyListeners();
  }

  Future<bool> login({required String email, required String senha}) async {
    _setLoading(true);
    try {
      _user   = await _repo.login(email: email, senha: senha);
      _status = AuthStatus.authenticated;
      _error  = null;
      return true;
    } catch (e) {
      _error = _extractError(e);
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> register({
    required String nome,
    required String email,
    required String senha,
    String? telefone,
    String role = 'particular',
    String? nomeEmpresa,
  }) async {
    _setLoading(true);
    try {
      _user   = await _repo.register(
        nome: nome, email: email, senha: senha,
        telefone: telefone, role: role, nomeEmpresa: nomeEmpresa,
      );
      _status = AuthStatus.authenticated;
      _error  = null;
      return true;
    } catch (e) {
      _error = _extractError(e);
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    _user   = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  void clearError() { _error = null; notifyListeners(); }

  void _setLoading(bool v) { _loading = v; notifyListeners(); }

  String _extractError(dynamic e) {
    if (e is Exception) {
      final msg = e.toString();
      if (msg.contains('400')) return 'Email ou senha incorrectos.';
      if (msg.contains('409')) return 'Este email já está registado.';
      if (msg.contains('422')) return 'Dados inválidos. Verifica os campos.';
      if (msg.contains('SocketException') || msg.contains('connection')) {
        return 'Sem ligação à internet.';
      }
    }
    return 'Erro inesperado. Tenta novamente.';
  }
}

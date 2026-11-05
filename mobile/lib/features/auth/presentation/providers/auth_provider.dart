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

  AuthStatus get status   => _status;
  UserModel?  get user    => _user;
  String?     get error   => _error;
  bool        get loading => _loading;
  bool        get isAuth  => _status == AuthStatus.authenticated;

  // ── Inicialização ─────────────────────────────────────────────────────────
  Future<void> init() async {
    final user = await _repo.tryRestoreSession();
    _user   = user;
    _status = user != null ? AuthStatus.authenticated : AuthStatus.unauthenticated;
    notifyListeners();
  }

  // ── Login ─────────────────────────────────────────────────────────────────
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
    } finally { _setLoading(false); }
  }

  // ── Registo ───────────────────────────────────────────────────────────────
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
        telefone: telefone, role: role, nomeEmpresa: nomeEmpresa);
      _status = AuthStatus.authenticated;
      _error  = null;
      return true;
    } catch (e) {
      _error = _extractError(e);
      return false;
    } finally { _setLoading(false); }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  Future<void> logout() async {
    await _repo.logout();
    _user   = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  // ── Recuperação de senha ─────────────────────────────────────────────────
  Future<bool> forgotPassword(String email) async {
    _setLoading(true);
    try {
      await _repo.forgotPassword(email);
      _error = null;
      return true;
    } catch (e) {
      _error = _extractError(e);
      return false;
    } finally { _setLoading(false); }
  }

  Future<bool> forgotPasswordPhone(String telefone) async {
    _setLoading(true);
    try {
      await _repo.forgotPasswordPhone(telefone);
      _error = null;
      return true;
    } catch (e) {
      _error = _extractError(e);
      return false;
    } finally { _setLoading(false); }
  }

  Future<bool> resetPasswordPhone({
    required String telefone,
    required String codigo,
    required String novaSenha,
  }) async {
    _setLoading(true);
    try {
      await _repo.resetPasswordPhone(
        telefone: telefone, codigo: codigo, novaSenha: novaSenha);
      _error = null;
      return true;
    } catch (e) {
      _error = _extractError(e);
      return false;
    } finally { _setLoading(false); }
  }

  // ── Mudar senha ───────────────────────────────────────────────────────────
  Future<bool> changePassword({
    required String senhaAtual,
    required String senhaNova,
  }) async {
    _setLoading(true);
    try {
      await _repo.changePassword(senhaAtual: senhaAtual, senhaNova: senhaNova);
      _error = null;
      return true;
    } catch (e) {
      _error = _extractError(e);
      return false;
    } finally { _setLoading(false); }
  }

  // ── Editar perfil ─────────────────────────────────────────────────────────
  Future<bool> updateProfile(Map<String, dynamic> data) async {
    _setLoading(true);
    try {
      _user  = await _repo.updateProfile(data);
      _error = null;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _extractError(e);
      return false;
    } finally { _setLoading(false); }
  }

  // ── Verificação OTP ───────────────────────────────────────────────────────
  Future<bool> requestVerification(String canal) async {
    _setLoading(true);
    try {
      await _repo.requestVerification(canal);
      _error = null;
      return true;
    } catch (e) {
      _error = _extractError(e);
      return false;
    } finally { _setLoading(false); }
  }

  Future<bool> verifyCode(String canal, String codigo) async {
    _setLoading(true);
    try {
      await _repo.verifyCode(canal, codigo);
      _user = await _repo.fetchMe();
      _error = null;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _extractError(e);
      return false;
    } finally { _setLoading(false); }
  }

  // ── Utilitários ───────────────────────────────────────────────────────────
  void clearError() { _error = null; notifyListeners(); }
  void _setLoading(bool v) { _loading = v; notifyListeners(); }

  String _extractError(dynamic e) {
    final msg = e.toString();
    // Show raw error in debug to help diagnose
    if (msg.contains('400')) return _parseDetail(msg) ?? 'Dados inválidos.';
    if (msg.contains('401')) return 'Email ou senha incorrectos.';
    if (msg.contains('403')) return 'Conta desactivada. Contacta o suporte.';
    if (msg.contains('409')) return 'Este email já está registado.';
    if (msg.contains('SocketException') || msg.contains('connection') ||
        msg.contains('ERR_FAILED') || msg.contains('XMLHttp'))
      return 'Sem ligação ao servidor.';
    // Surface the real error so we can diagnose
    return 'Erro: $msg';
  }

  String? _parseDetail(String msg) {
    final m = RegExp(r'"detail":"([^"]+)"').firstMatch(msg);
    return m?.group(1);
  }
}

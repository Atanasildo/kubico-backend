class ApiEndpoints {
  ApiEndpoints._();

  // Auth
  static const String register            = '/auth/register';
  static const String login               = '/auth/login';
  static const String refresh             = '/auth/refresh';
  static const String logout              = '/auth/logout';
  static const String me                  = '/auth/me';
  static const String changePassword      = '/auth/change-password';
  static const String forgotPassword      = '/auth/forgot-password';
  static const String resetPassword       = '/auth/reset-password';
  static const String forgotPasswordPhone = '/auth/forgot-password-phone';
  static const String resetPasswordPhone  = '/auth/reset-password-phone';

  // Utilizador
  static const String updateMe      = '/users/me';
  static const String uploadProfile = '/uploads/profile';

  // Verificação OTP
  static const String requestVerification = '/verification/request';
  static const String verifyCode          = '/verification/verify';

  // Imóveis
  static const String properties   = '/properties';
  static const String myProperties = '/properties/me';
  static String property(String id)       => '/properties/$id';
  static String propertyAnalytics(String id) => '/properties/$id/analytics';

  // Upload de imagens de imóvel
  static const String uploadImage = '/uploads/image';

  // Favoritos
  static const String favorites              = '/favorites';
  static String favoriteToggle(String id)   => '/favorites/$id';

  // Leads
  static const String leads = '/leads';

  // Alertas de pesquisa
  static const String alerts           = '/alerts';
  static String alert(String id)       => '/alerts/$id';

  // Denúncias
  static const String reports = '/reports';

  // Pagamentos / destaque
  static const String payments  = '/payments';
  static const String destaque  = '/payments/destaque';
}

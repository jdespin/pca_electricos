class UserProfile {
  final int idusuario;
  final String usuarioStrnombre;
  final String strnombres;
  final String strapellidos;
  final String strcedula;
  final String strcelular1;
  final String strtiposangre;
  final String strcorreo1;

  const UserProfile({
    required this.idusuario,
    required this.usuarioStrnombre,
    required this.strnombres,
    required this.strapellidos,
    required this.strcedula,
    required this.strcelular1,
    required this.strtiposangre,
    required this.strcorreo1,
  });

  static UserProfile fromMap(Map<String, dynamic> map) {
    return UserProfile(
      idusuario: map['idusuario'] as int,
      usuarioStrnombre: map['usuario_strnombre'] as String? ?? '',
      strnombres: map['strnombres'] as String? ?? '',
      strapellidos: map['strapellidos'] as String? ?? '',
      strcedula: map['strcedula'] as String? ?? '',
      strcelular1: map['strcelular1'] as String? ?? '',
      strtiposangre: map['strtiposangre'] as String? ?? '',
      strcorreo1: map['strcorreo1'] as String? ?? '',
    );
  }
}

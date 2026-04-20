class Technician {
  final int? idusuario;
  final String nombre;
  final String apellido;
  final String usuarioStrnombre;
  final String celular;
  final String tipoSangre;
  final String usuarioStrclave;
  final int createdAt;

  const Technician({
    this.idusuario,
    required this.nombre,
    required this.apellido,
    required this.usuarioStrnombre,
    required this.celular,
    required this.tipoSangre,
    required this.usuarioStrclave,
    required this.createdAt,
  });

  Map<String, Object?> toMap() => {
        'idusuario': idusuario,
        'nombre': nombre,
        'apellido': apellido,
        'usuario_strnombre': usuarioStrnombre,
        'celular': celular,
        'tipo_sangre': tipoSangre,
        'usuario_strclave': usuarioStrclave,
        'created_at': createdAt,
      };

  static Technician fromMap(Map<String, Object?> map) {
    return Technician(
      idusuario: map['idusuario'] as int?,
      nombre: map['nombre'] as String,
      apellido: map['apellido'] as String,
      usuarioStrnombre: map['usuario_strnombre'] as String,
      celular: map['celular'] as String,
      tipoSangre: map['tipo_sangre'] as String,
      usuarioStrclave: map['usuario_strclave'] as String? ?? '',
      createdAt: map['created_at'] as int,
    );
  }
}

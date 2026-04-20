class WorkOrder {
  final int? id;
  final int? idordenBackend;
  final String title;
  final String description;
  final String status;
  final String tipo;
  final bool esLider;
  final int createdAt;
  final int updatedAt;
  final String? calificacion;
  final String? observacion;
  final bool sincronizado;
  final String? supervisorNombre;

  const WorkOrder({
    this.id,
    this.idordenBackend,
    required this.title,
    required this.description,
    required this.status,
    this.tipo = 'inspeccion',
    this.esLider = true,
    required this.createdAt,
    required this.updatedAt,
    this.calificacion,
    this.observacion,
    this.sincronizado = false,
    this.supervisorNombre,
  });

  WorkOrder copyWith({
    int? id,
    int? idordenBackend,
    String? title,
    String? description,
    String? status,
    String? tipo,
    bool? esLider,
    int? createdAt,
    int? updatedAt,
    String? calificacion,
    String? observacion,
    bool? sincronizado,
    String? supervisorNombre,
  }) {
    return WorkOrder(
      id: id ?? this.id,
      idordenBackend: idordenBackend ?? this.idordenBackend,
      title: title ?? this.title,
      description: description ?? this.description,
      status: status ?? this.status,
      tipo: tipo ?? this.tipo,
      esLider: esLider ?? this.esLider,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      calificacion: calificacion ?? this.calificacion,
      observacion: observacion ?? this.observacion,
      sincronizado: sincronizado ?? this.sincronizado,
      supervisorNombre: supervisorNombre ?? this.supervisorNombre,
    );
  }

  Map<String, Object?> toMap() => {
        'id': id,
        'idorden_backend': idordenBackend,
        'title': title,
        'description': description,
        'status': status,
        'tipo': tipo,
        'es_lider': esLider ? 1 : 0,
        'created_at': createdAt,
        'updated_at': updatedAt,
        'calificacion': calificacion,
        'observacion': observacion,
        'sincronizado': sincronizado ? 1 : 0,
        'supervisor_nombre': supervisorNombre,
      };

  static WorkOrder fromMap(Map<String, Object?> map) {
    return WorkOrder(
      id: map['id'] as int?,
      idordenBackend: map['idorden_backend'] as int?,
      title: map['title'] as String,
      description: map['description'] as String,
      status: map['status'] as String,
      tipo: map['tipo'] as String? ?? 'inspeccion',
      esLider: (map['es_lider'] as int? ?? 1) == 1,
      createdAt: map['created_at'] as int,
      updatedAt: map['updated_at'] as int,
      calificacion: map['calificacion'] as String?,
      observacion: map['observacion'] as String?,
      sincronizado: (map['sincronizado'] as int? ?? 0) == 1,
      supervisorNombre: map['supervisor_nombre'] as String?,
    );
  }
}

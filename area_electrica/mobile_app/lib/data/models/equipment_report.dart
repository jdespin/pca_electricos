class EquipmentReport {
  final int? id;
  final int orderId;
  final String equipmentType; 
  final String potencia;
  final String serial;
  final String marca;
  final String caf;
  final String observaciones;
  final int createdAt;
  final int updatedAt;

  const EquipmentReport({
    this.id,
    required this.orderId,
    required this.equipmentType,
    this.potencia = '',
    this.serial = '',
    this.marca = '',
    this.caf = '',
    this.observaciones = '',
    required this.createdAt,
    required this.updatedAt,
  });

  EquipmentReport copyWith({
    int? id,
    int? orderId,
    String? equipmentType,
    String? potencia,
    String? serial,
    String? marca,
    String? caf,
    String? observaciones,
    int? createdAt,
    int? updatedAt,
  }) {
    return EquipmentReport(
      id: id ?? this.id,
      orderId: orderId ?? this.orderId,
      equipmentType: equipmentType ?? this.equipmentType,
      potencia: potencia ?? this.potencia,
      serial: serial ?? this.serial,
      marca: marca ?? this.marca,
      caf: caf ?? this.caf,
      observaciones: observaciones ?? this.observaciones,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, Object?> toMap() => {
        'id': id,
        'order_id': orderId,
        'equipment_type': equipmentType,
        'potencia': potencia,
        'serial': serial,
        'marca': marca,
        'caf': caf,
        'observaciones': observaciones,
        'created_at': createdAt,
        'updated_at': updatedAt,
      };

  static EquipmentReport fromMap(Map<String, Object?> map) {
    return EquipmentReport(
      id: map['id'] as int?,
      orderId: map['order_id'] as int,
      equipmentType: map['equipment_type'] as String,
      potencia: map['potencia'] as String? ?? '',
      serial: map['serial'] as String? ?? '',
      marca: map['marca'] as String? ?? '',
      caf: map['caf'] as String? ?? '',
      observaciones: map['observaciones'] as String? ?? '',
      createdAt: map['created_at'] as int,
      updatedAt: map['updated_at'] as int,
    );
  }
}

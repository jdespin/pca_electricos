class EquipmentPhoto {
  final int? id;
  final int orderId;
  final String equipmentType;
  final String photoLabel; 
  final bool isRequired;
  final String photoPath;
  final double? latitude;
  final double? longitude;
  final int createdAt;

  const EquipmentPhoto({
    this.id,
    required this.orderId,
    required this.equipmentType,
    required this.photoLabel,
    required this.isRequired,
    required this.photoPath,
    this.latitude,
    this.longitude,
    required this.createdAt,
  });

  bool get hasLocation => latitude != null && longitude != null;

  Map<String, Object?> toMap() => {
        'id': id,
        'order_id': orderId,
        'equipment_type': equipmentType,
        'photo_label': photoLabel,
        'is_required': isRequired ? 1 : 0,
        'photo_path': photoPath,
        'latitude': latitude,
        'longitude': longitude,
        'created_at': createdAt,
      };

  static EquipmentPhoto fromMap(Map<String, Object?> map) {
    return EquipmentPhoto(
      id: map['id'] as int?,
      orderId: map['order_id'] as int,
      equipmentType: map['equipment_type'] as String,
      photoLabel: map['photo_label'] as String? ?? '',
      isRequired: (map['is_required'] as int? ?? 0) == 1,
      photoPath: map['photo_path'] as String,
      latitude: map['latitude'] as double?,
      longitude: map['longitude'] as double?,
      createdAt: map['created_at'] as int,
    );
  }
}

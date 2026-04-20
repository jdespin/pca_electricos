import 'package:flutter/material.dart';
import 'ordenes_list_page.dart';

class OrdenesFinalizadasPage extends StatelessWidget {
  const OrdenesFinalizadasPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const OrdenesListPage(status: 'finalizada');
  }
}

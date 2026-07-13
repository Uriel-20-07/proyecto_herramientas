package com.example.demo.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.models.EstadoReceta;
import com.example.demo.models.Receta;
import com.example.demo.repositories.RecetaRepository;

@Service
public class RecetaService {

    @Autowired
    private RecetaRepository recetaRepository;

    public Receta guardar(Receta receta) {
        receta.setEstado(EstadoReceta.EN_ESPERA);
        return recetaRepository.save(receta);
    }

    public List<Receta> listarPorEstado(EstadoReceta estado) {
        return recetaRepository.findByEstado(estado);
    }

    public List<Receta> listarPorPaciente(Integer pacienteId) {
        return recetaRepository.findByPacienteId(pacienteId);
    }

    public Receta actualizarEstado(Integer id, EstadoReceta nuevoEstado, Integer revisadoPor, String comentario) {
        Receta receta = recetaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Receta no encontrada"));
        receta.setEstado(nuevoEstado);
        receta.setRevisadoPor(revisadoPor);
        receta.setComentarioRevision(comentario);
        receta.setFechaRevision(java.time.LocalDateTime.now());
        return recetaRepository.save(receta);
    }
}
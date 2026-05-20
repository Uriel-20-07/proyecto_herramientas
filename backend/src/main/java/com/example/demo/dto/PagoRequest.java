package com.example.demo.dto;

import lombok.Data;

@Data
public class PagoRequest {
    private String metodoPago;
    private String direccionEnvio;
    private String numeroTarjeta;
    private String nombreTarjeta;
    private String expiracion;
    private String cvv;
    private String numeroCelular;
    private String tokenYape;
    private String codigoCupon;
}

package com.swifteats.swifteats.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeocodingService {

    private final RestClient.Builder restClientBuilder = RestClient.builder();

    @Value("${app.geocoding.enabled:true}")
    private boolean geocodingEnabled;

    @Value("${app.geocoding.base-url:https://nominatim.openstreetmap.org}")
    private String baseUrl;

    @Value("${app.geocoding.user-agent:SwiftEats/1.0}")
    private String userAgent;

    public Coordinates geocode(String address, String city) {
        if (!geocodingEnabled || (address == null || address.isBlank()) && (city == null || city.isBlank())) {
            return null;
        }

        String query = city == null || city.isBlank() ? address : address + ", " + city;
        try {
            RestClient client = restClientBuilder.baseUrl(baseUrl)
                    .defaultHeader("User-Agent", userAgent)
                    .build();
            GeocodeResult[] results = client.get()
                    .uri(uriBuilder -> uriBuilder.path("/search")
                            .queryParam("q", query)
                            .queryParam("format", "jsonv2")
                            .queryParam("limit", 1)
                            .build())
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(GeocodeResult[].class);

            if (results == null || results.length == 0) {
                return null;
            }
            return new Coordinates(Double.parseDouble(results[0].lat()), Double.parseDouble(results[0].lon()));
        } catch (Exception ex) {
            log.warn("Geocoding failed for query '{}': {}", query, ex.getMessage());
            return null;
        }
    }

    private record GeocodeResult(String lat, String lon) {}

    public record Coordinates(Double latitude, Double longitude) {}
}

package com.swifteats.swifteats.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI swiftEatsOpenApi() {
        return new OpenAPI().info(new Info()
                .title("SwiftEats API")
                .version("v1")
                .description("SwiftEats backend API with versioned endpoints under /api/v1.")
                .contact(new Contact().name("SwiftEats")));
    }

    @Bean
    public GroupedOpenApi v1Api() {
        return GroupedOpenApi.builder()
                .group("v1")
                .pathsToMatch("/api/v1/**")
                .build();
    }

    @Bean
    public GroupedOpenApi legacyApi() {
        return GroupedOpenApi.builder()
                .group("legacy")
                .pathsToMatch("/api/**")
                .pathsToExclude("/api/v1/**")
                .build();
    }
}

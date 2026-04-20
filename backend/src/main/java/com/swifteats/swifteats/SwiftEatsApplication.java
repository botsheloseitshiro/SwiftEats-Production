package com.swifteats.swifteats;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SwiftEatsApplication {

    public static void main(String[] args) {

        SpringApplication.run(SwiftEatsApplication.class, args);
        System.out.println("==============================================");
        System.out.println("  SwiftEats Backend is running!");
        System.out.println("  API Base URL: http://localhost:8080/swagger-ui/index.html");
        System.out.println("==============================================");
    }
}

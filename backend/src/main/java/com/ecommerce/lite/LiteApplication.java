package com.ecommerce.lite;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class LiteApplication {
    public static void main(String[] args) {
        SpringApplication.run(LiteApplication.class, args);
    }
}

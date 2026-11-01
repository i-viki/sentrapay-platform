package dev.jayavignesh.sentrapay.recon;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;

@SpringBootApplication
@EnableKafka
public class ReconciliationApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReconciliationApplication.class, args);
    }
}


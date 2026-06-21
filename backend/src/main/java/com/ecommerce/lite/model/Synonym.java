package com.ecommerce.lite.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "synonyms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Synonym {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String term;

    @Column(nullable = false)
    private String synonym;
}

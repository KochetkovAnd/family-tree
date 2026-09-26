package com.kochetkov.familytree.entity;

import com.kochetkov.familytree.entity.base.AuditEntity;
import jakarta.persistence.AttributeOverride;
import jakarta.persistence.AttributeOverrides;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Entity
@Table(name = "person")
@SequenceGenerator(name = "entity_id_seq_generator", sequenceName = "person_person_id_seq", allocationSize = 1)
@AttributeOverrides({
        @AttributeOverride(name = "id", column = @Column(name = "person_id")),
        @AttributeOverride(name = "createdAt", column = @Column(name = "person_created_at", nullable = false, updatable = false)),
        @AttributeOverride(name = "createdBy", column = @Column(name = "person_created_by", nullable = false, updatable = false)),
        @AttributeOverride(name = "updatedAt", column = @Column(name = "person_updated_at", nullable = false)),
        @AttributeOverride(name = "updatedBy", column = @Column(name = "person_updated_by", nullable = false)),
        @AttributeOverride(name = "deletedAt", column = @Column(name = "person_deleted_at")),
        @AttributeOverride(name = "deletedBy", column = @Column(name = "person_deleted_by")),
})
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Person extends AuditEntity {

    @Column(name = "person_lastname", nullable = false)
    String lastName;

    @Column(name = "person_firstname", nullable = false)
    String firstName;

    // Отчество — table calls it person_secondname.
    @Column(name = "person_secondname")
    String middleName;

    @Column(name = "person_birthday")
    LocalDate birthDate;

    @Column(name = "person_birthplace")
    String birthPlace;
}

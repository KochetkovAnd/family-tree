package com.kochetkov.familytree.dto;

import com.kochetkov.familytree.dto.auth.base.AuditEntityDTO;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PersonDTO extends AuditEntityDTO {
    String lastName;
    String firstName;
    String middleName;
    LocalDate birthDate;
    String birthPlace;
}

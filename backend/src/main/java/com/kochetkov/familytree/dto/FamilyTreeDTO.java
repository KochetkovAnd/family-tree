package com.kochetkov.familytree.dto;

import com.kochetkov.familytree.dto.auth.base.AuditEntityDTO;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FamilyTreeDTO extends AuditEntityDTO {
    String name;
}

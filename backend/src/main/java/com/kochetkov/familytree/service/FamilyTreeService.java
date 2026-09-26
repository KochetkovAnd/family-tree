package com.kochetkov.familytree.service;

import com.kochetkov.familytree.converter.FamilyTreeConverter;
import com.kochetkov.familytree.dto.FamilyTreeDTO;
import com.kochetkov.familytree.entity.FamilyTree;
import com.kochetkov.familytree.repository.FamilyTreeRepository;
import com.kochetkov.familytree.service.base.AuditEntityService;
import org.springframework.stereotype.Service;

@Service
public class FamilyTreeService extends AuditEntityService<FamilyTree, FamilyTreeDTO, FamilyTreeRepository, FamilyTreeConverter> {

    public FamilyTreeService(FamilyTreeRepository repository, FamilyTreeConverter converter) {
        super(repository, converter);
    }
}

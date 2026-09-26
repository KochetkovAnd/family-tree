package com.kochetkov.familytree.converter;

import com.kochetkov.familytree.converter.base.AbstractConverter;
import com.kochetkov.familytree.dto.FamilyTreeDTO;
import com.kochetkov.familytree.entity.FamilyTree;
import org.springframework.stereotype.Component;

@Component
public class FamilyTreeConverter extends AbstractConverter<FamilyTree, FamilyTreeDTO> {

    public FamilyTreeConverter() {
        super(FamilyTree::new, FamilyTreeDTO::new);
    }
}

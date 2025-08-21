using BusinessPartnerService as service from '../../srv/business-partner-service';

annotate service.BusinessPartners with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : BusinessPartner,
            Label : 'Business Partner ID',
        },
        {
            $Type : 'UI.DataField',
            Value : BusinessPartnerName,
            Label : 'Business Partner Name',
        },
        {
            $Type : 'UI.DataField',
            Value : BusinessPartnerCategory,
            Label : 'Category',
        },
        {
            $Type : 'UI.DataField',
            Value : BusinessPartnerGrouping,
            Label : 'Grouping',
        },
        {
            $Type : 'UI.DataField',
            Value : CreationDate,
            Label : 'Creation Date',
        },
        {
            $Type : 'UI.DataField',
            Value : CreatedBy,
            Label : 'Created By',
        },
    ]
);

annotate service.BusinessPartners with @(
    UI.FieldGroup #GeneratedGroup1 : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : BusinessPartner,
                Label : 'Business Partner ID',
            },
            {
                $Type : 'UI.DataField',
                Value : BusinessPartnerName,
                Label : 'Business Partner Name',
            },
            {
                $Type : 'UI.DataField',
                Value : BusinessPartnerCategory,
                Label : 'Category',
            },
            {
                $Type : 'UI.DataField',
                Value : BusinessPartnerGrouping,
                Label : 'Grouping',
            },
            {
                $Type : 'UI.DataField',
                Value : CreationDate,
                Label : 'Creation Date',
            },
            {
                $Type : 'UI.DataField',
                Value : CreatedBy,
                Label : 'Created By',
            },
            {
                $Type : 'UI.DataField',
                Value : LastChangeDate,
                Label : 'Last Change Date',
            },
            {
                $Type : 'UI.DataField',
                Value : LastChangedBy,
                Label : 'Last Changed By',
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'Business Partner Details',
            Target : '@UI.FieldGroup#GeneratedGroup1',
        },
    ]
);

annotate service.BusinessPartners with @(
    UI.HeaderInfo : {
        Title : {
            $Type : 'UI.DataField',
            Value : BusinessPartnerName,
        },
        TypeName : 'Business Partner',
        TypeNamePlural : 'Business Partners',
        Description : {
            $Type : 'UI.DataField',
            Value : BusinessPartner,
        }
    }
);

annotate service.BusinessPartners with @(
    UI.SelectionFields : [
        BusinessPartner,
        BusinessPartnerName,
        BusinessPartnerCategory,
        BusinessPartnerGrouping,
        CreatedBy,
    ]
);

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/UIComponent",
    "br/com/gestao/fioriappadminusers/util/Formatter",
    "sap/ui/core/Fragment",
    "sap/ui/core/ValueState",
    "sap/ui/model/json/JSONModel",
    "br/com/gestao/fioriappadminusers/util/Validator",
    "sap/m/BusyDialog",
    "sap/ui/model/odata/ODataModel",
    "sap/ui/core/ListItem"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,
        Filter,
        FilterOperator,
        MessageBox,
        MessageToast,
        UIComponent,
        Formatter,
        Fragment,
        ValueState,
        JSONModel,
        Validator,
        BusyDialog,
        ODataModel,
        ListItem) {
        "use strict";

        return Controller.extend("br.com.gestao.fioriappadminusers.controller.Lista", {

            objFormatter: Formatter,

            onInit: function () {
                var oConfiguration = sap.ui.getCore().getConfiguration();
                oConfiguration.setLanguage("pt_BR");

                sap.ui.getCore().attachValidationError(function (oEvent) {
                    oEvent.getParameter("element").setValueState(ValueState.Error);
                });

                sap.ui.getCore().attachValidationSuccess(function (oEvent) {
                    oEvent.getParameter("element").setValueState(ValueState.Success);
                });
            },

            criarModel: function () {
                // Model produto
                if(!this.getView().getModel("MDL_Usuario")){
                    var oModel = new JSONModel();
                    this.getView().setModel(oModel, "MDL_Usuario");
                }
            },

            onSearch: function (oEvent) {

                let oUserIdInput = this.getView().byId("userID");
                let oUserNomeInput = this.getView().byId("userName");
                let oUserCategInput = this.getView().byId("emailInput");

                var objFilter = {filters: [], and: true};

                if(oUserIdInput.getValue()){
                    objFilter.filters.push(new Filter("Userid", FilterOperator.Contains, oUserIdInput.getValue()));
                }

                if(oUserNomeInput.getValue()){
                    objFilter.filters.push(new Filter("Firstname", FilterOperator.Contains, oUserNomeInput.getValue()));
                }

                if(oUserCategInput.getValue()){
                    objFilter.filters.push(new Filter("Email", FilterOperator.Contains, oUserCategInput.getValue()));
                }

                var oFilter = new Filter(objFilter);

                // Criação do objeto List e acesso a agregação Items onde sabemos qual a entidade onde será aplicado o filtro
                let oTable = this.getView().byId("tableUsers");
                let binding = oTable.getBinding("items");

                // Aplicando o filtro para o Databinding
                binding.filter(oFilter);
            },

            onFilterChange: function (oEvent) {

            },

            onAfterVariantLoad: function (oEvent) {

            },

            onReset: function (oEvent) {

            },

            onRouting: function (oEvent) {
                var oRoute = new sap.ui.core.UIComponent.getRouterFor(this);
                oRoute.navTo("Detalhes");
            },

            onSelectedItem: function (oEvent) {

                // PASSO 1 - Captura do Usuário

                // O getBindingContext não tem model como parâmetro porque o model que ele está usando é aquele sem nome dos models principais 
                var sUserid = oEvent.getSource().getBindingContext().getProperty("Userid");

                // PASSO 2 - Envio para o Route de Detalhes do produto
                var oRoute = new sap.ui.core.UIComponent.getRouterFor(this);
                oRoute.navTo("Detalhes", { userid: sUserid });
            },

            onNovoUsuario: function (oEvent) {

                this.criarModel();

                var oView = this.getView();

                // Verifico se o objeto fragment existe. Se não crio e adiciono na View
                if (!this._Usuario) {
                    this._Usuario = Fragment.load({
                        id: oView.getId(),
                        name: "br.com.gestao.fioriappadminusers.frags.Inserir",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    });
                }

                this._Usuario.then(function (oDialog) {
                    // Abertura do fragment
                    oDialog.open();

                    // Chamada da função para carregar os usuários
                    //that.onGetUsuarios();
                    //that.getReadOpcoes();
                });
            },

            onValueHelpClose: function (oEvent) {

                var oSelectedItem = oEvent.getParameter("selectedItem");
                var oInput = null;

                if (this.byId(this._oInput)) {
                    oInput = this.byId(this._oInput);
                } else {
                    oInput = sap.ui.getCore().byId(this._oInput);
                }

                if (!oSelectedItem) {
                    oInput.resetProperty("value");
                    return;
                }

                oInput.setValue(oSelectedItem.getTitle());
            },

            closeLightBox: function (oEvent) {
                this.getView().byId("dialogCadProd").close();
            },

            onValida: function () {

                var validator = new Validator();

                if (validator.validate(this.byId("dialogCadProd"))) {
                    this.onInsert();
                }
            },

            onInsert: function () {

                //  1 - Criando referência do Model
                var oModel = this.getView().getModel("MDL_Usuario");
                var objNovo = oModel.getData();

                // 3 - Criando uma referência do arquivo i18n
                var bundle = this.getView().getModel("i18n").getResourceBundle();
                var that = this;

                // 4 - Criar o objeto model referência do model default (ODataModel)
                var oModelUsuario = this.getView().getModel();

                MessageBox.confirm(
                    bundle.getText("insertDialogMsg"),
                    function (oAction) {

                        // Verificando se o usuário confirmou ou não a operação
                        if (MessageBox.Action.OK === oAction) {

                            // Criando um BusyDialog
                            that._oBusyDialog = new BusyDialog({
                                text: bundle.getText("Sending")
                            });

                            that._oBusyDialog.open();

                            var oModelSend = new ODataModel(oModelUsuario.sServiceUrl, true);
                            oModelSend.create("UsersSet", objNovo, null,
                                function (d, r) {
                                    if (r.statusCode === 201) {
                                        // Limpando os models
                                        that.getView().setModel(null, "MDL_Usuario");

                                        MessageToast.show(bundle.getText("insertDialogSuccess", [objNovo.Firstname + ' ' + objNovo.Lastname]), {
                                            duration: 5000
                                        });

                                        // Fechando a janela de cadastro
                                        that.dialogClose();

                                        // Dando refresh no model
                                        that.getView().getModel().refresh();

                                        // Fechando o BusyDialog
                                        that._oBusyDialog.close();
                                    }
                                },
                                function (e) {
                                    // Fechando o BusyDialog
                                    that._oBusyDialog.close();
                                    var oRet = JSON.parse(e.responde.body);
                                    MessageToast.show(oRet.error.message.value, {
                                        duration: 5000
                                    });
                                }
                            );
                            
                        }
                    }
                );
            },

            dialogClose: function () {
                this._Usuario.then(function (oDialog) {
                    // Abertura do fragment
                    oDialog.close();
                });
            },

            geraID: function(oEvent) {
                var oView = this.getView();
                var sFirstname = oView.byId("idInputFirstname").getValue();
                var sLastname = oView.byId("idInputLastname").getValue();
                if(sFirstname != '' || sLastname != ''){
                    var random = Math.floor(Math.random() * (10000 - 1000) + 1000);
                    oView.byId("idInputUserid").setValue(sFirstname.substring(0, 1).toUpperCase() + sLastname.substring(0, 1).toUpperCase() + random);
                }else{
                    oView.byId("idInputUserid").setValue('');
                }
            }
        });
    });

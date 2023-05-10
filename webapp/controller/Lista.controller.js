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

                // PASSO 1 - Captura do produto

                // O getBindingContext não tem model como parâmetro porque o model que ele está usando é aquele sem nome dos models principais 
                var oProductId = oEvent.getSource().getBindingContext().getProperty("Productid");

                // Se aquele model tivesse um nome, a instrução deveria ser chamada assim
                //var oProductId = oEvent.getSource().getBindingContext("nome do model aqui").getProperty("Productid");


                // PASSO 2 - Envio para o Route de Detalhes do produto
                var oRoute = new sap.ui.core.UIComponent.getRouterFor(this);
                oRoute.navTo("Detalhes", { productId: oProductId });
            },

            onNovoUsuario: function (oEvent) {

                this.criarModel();

                var oView = this.getView();
                var that = this;

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
                    that.onGetUsuarios();
                    //that.getReadOpcoes();
                });
            },

            getReadOpcoes: function () {

                // Item 1 - Chamada via URL
                var sElement = "/Produtos";

                //var sElement = "/Produtos('322E3BBF5A')";
                //var sElement = "/Produtos('322E3BBF5A')/to_cat";

                var afilters = [];
                afilters.push(new Filter("Status", FilterOperator.EQ, 'E'));
                afilters.push(new Filter("Category", FilterOperator.EQ, 'ED'));

                // Cria o objeto model default 
                var oModel = this.getView().getModel();

                // Realizar a chamada para o SAP
                var oModelSend = new ODataModel(oModel.sServiceUrl, true);

                oModelSend.read(sElement, {
                    filters: afilters,
                    urlParameters: {
                        $expand: "to_cat"
                    },

                    success: function (oData, results) {
                        if (results.statusCode === 200) { // Sucesso do Get

                        }
                    },

                    error: function (e) {
                        var oRet = JSON.parse(e.response.body);
                        MessageToast.show(oRet.error.message.value, {
                            duration: 4000
                        });
                    }
                });
            },

            onGetUsuarios: function () {

                var oView = this.getView();

                if(!oView.getModel("MDL_Users")){
                    var strEntity = "/sap/opu/odata/sap/ZSB_USERS_13";
                    var oModelSend = new ODataModel(strEntity, true);
                    var bundle = oView.getModel("i18n").getResourceBundle();

                    oModelSend.read("/Usuarios", {
                        success: function (oData, results) {
                            if (results.statusCode === 200) {
                                
                                var oModelUsers = new JSONModel();
                                oModelUsers.setData(oData.results);
                                oView.setModel(oModelUsers, "MDL_Users");

                                oView.byId("selChangedby").insertItem(new ListItem({text: bundle.getText("selectSelecione")}), 0);
                            }
                        },
                        error: function (e) {
                            var oRet = JSON.parse(e.responde.body);
                            MessageToast.show(oRet.error.message.value, {
                                duration: 5000
                            });
                        }
                    });
                }
            },

            onValueHelpSearch: function (oEvent) {
                var sValue = oEvent.getParameter("value");

                // Opção 1 - Crio um único objeto filtro
                // Criando um objeto do tipo filter que iria receber o valor e associar na propriedade Description
                //var oFilter = new Filter("Description", FilterOperator.Contains, sValue);
                //oEvent.getSource().getBinding("items").filter([oFilter]);

                // Opção 2- Podemos criar um objeto (dinâmico) onde adiciono várias propriedades
                var objFilter = { filters: [], and: false };
                objFilter.filters.push(new Filter("Description", FilterOperator.Contains, sValue));
                objFilter.filters.push(new Filter("Category", FilterOperator.Contains, sValue));

                var oFilter = new Filter(objFilter);

                oEvent.getSource().getBinding("items").filter(oFilter);
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

            getSupplier: function (oEvent) {
                this._oInput = oEvent.getSource().getId();
                var oValue = oEvent.getSource().getValue();
                var sElement = "/Fornecedores('" + oValue + "')";

                var oModel = this.getView().getModel();
                var oModelProduto = this.getView().getModel("MDL_Usuario");
                var oModelSend = new ODataModel(oModel.sServiceUrl, true);

                oModelSend.read(sElement, {
                    success: function (oData, results) {
                        if (results.statusCode === 200) {
                            oModelProduto.setProperty("/Supplierid", oData.Lifnr);
                            oModelProduto.setProperty("/Suppliername", oData.Name1);
                        }
                    },
                    error: function (e) {
                        oModelProduto.setProperty("/Supplierid", "");
                        oModelProduto.setProperty("/Suppliername", "");

                        var oRet = JSON.parse(e.responde.body);
                        MessageToast.show(oRet.error.message.value, {
                            duration: 5000
                        });
                    }
                });

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

                //  2 - Manipulando propriedades
                objNovo.Productid = this.geraID();
                objNovo.Price = objNovo.Price[0].toString();
                objNovo.Weightmeasure = objNovo.Weightmeasure.toString();
                objNovo.Width = objNovo.Width.toString();
                objNovo.Depth = objNovo.Depth.toString();
                objNovo.Height = objNovo.Height.toString();
                var date = objNovo.Createdat;
                objNovo.Createdat = (date.search("/") != -1) ? this.objFormatter.dateSAP(date) : date;
                objNovo.Currencycode = "BRL";
                objNovo.Userupdate = "";

                // 3 - Criando uma referência do arquivo i18n
                var bundle = this.getView().getModel("i18n").getResourceBundle();
                var that = this;

                // 4 - Criar o objeto model referência do model default (ODataModel)
                var oModelProduto = this.getView().getModel();

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

                            var oModelSend = new ODataModel(oModelProduto.sServiceUrl, true);
                            oModelSend.create("Produtos", objNovo, null,
                                function (d, r) {
                                    if (r.statusCode === 201) {
                                        // Limpando os models
                                        that.getView().setModel(null, "MDL_Usuario");
                                        that.getView().setModel(null, "MDL_Users");

                                        MessageToast.show(bundle.getText("insertDialogSuccess", [objNovo.Productid]), {
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

            geraID: function () {

                return 'xxxxxxxxxx'.replace(/[xy]/g, function (c) {

                    var r = Math.random() * 16 | 0,

                        v = c == 'x' ? r : (r & 0x3 | 0x8);

                    return v.toString(16).toUpperCase();

                });

            },

            // Também funciona para fechar o lightbox
            dialogClose: function () {
                this._Usuario.then(function (oDialog) {
                    // Abertura do fragment
                    oDialog.close();
                });
            },

            onSuggest: function (oEvent) {
                var sText = oEvent.getParameter("suggestValue");
                var aFilters = [];

                if (sText) {
                    aFilters.push(new Filter("Lifnr", FilterOperator.Contains, sText));
                }

                oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
            }
        });
    });

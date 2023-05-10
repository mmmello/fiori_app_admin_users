sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/format/NumberFormat",
    "br/com/gestao/fioriappadmin/util/Formatter",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "br/com/gestao/fioriappadmin/util/Validator",
    "sap/ui/core/ValueState",
    "sap/ui/model/odata/ODataModel",
    "sap/m/MessageBox",
    "sap/m/BusyDialog",
    "sap/ui/core/UIComponent",
    "sap/ui/core/routing/History"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, NumberFormat, Formatter, Fragment, JSONModel, MessageToast, Filter, FilterOperator, Validator, ValueState, ODataModel, MessageBox, BusyDialog, UIComponent, History) {
        "use strict";

        return Controller.extend("br.com.gestao.fioriappadmin.controller.Detalhes", {

            objFormatter: Formatter,

            onInit: function () {

                sap.ui.getCore().attachValidationError(function (oEvent) {
                    oEvent.getParameter("element").setValueState(ValueState.Error);
                });

                sap.ui.getCore().attachValidationSuccess(function (oEvent) {
                    oEvent.getParameter("element").setValueState(ValueState.Success);
                });


                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

                // Esse método é chamado toda vez que um route acontece nessa página
                // Neste caso, o Route está vindo da página Lista
                oRouter.getRoute("Detalhes").attachMatched(this.onBindingProdutoDetalhes, this);


                // 1 - Chamar a função onde irá fazer o carregamento dos fragments
                this._formFragments = {};

                this._showFormFragments("DisplayBasicInfo", "vboxViewBasicInfo");
                this._showFormFragments("DisplayTechInfo", "vboxViewTechInfo");

            },

            // 2 - Recebe como parâmetro o nome dos fragments e o nome dos VBox's de destino
            _showFormFragments: function (sFragmentName, sVBoxName) {
                var objVBox = this.byId(sVBoxName);
                objVBox.removeAllItems();

                this._getFormAllItems(sFragmentName).then(function (oVBox) {
                    objVBox.insertItem(oVBox);
                });
            },

            _getFormAllItems: function (sFragmentName) {
                var oFormFragment = this._formFragments[sFragmentName];
                var oView = this.getView();

                if (!oFormFragment) {
                    oFormFragment = Fragment.load({
                        id: oView.getId(),
                        name: "br.com.gestao.fioriappadmin.frags." + sFragmentName,
                        controller: this
                    });

                    this._formFragments[sFragmentName] = oFormFragment;
                }
                return oFormFragment;
            },

            onBindingProdutoDetalhes: function (oEvent) {

                var oProduto = oEvent.getParameter("arguments").productId;

                var oView = this.getView();

                // Criar um parâmetro de controle para redirecionamento da view após o delete
                this._bDelete = false;

                // Criar a URL de chamada da nossa entidade de Produtos
                var sURL = "/Produtos('" + oProduto + "')";

                oView.bindElement({
                    path: sURL,
                    parameters: { expand: 'to_cat,to_users' },

                    events: {
                        change: this.onBindingChange.bind(this),
                        dataRequested: function () {
                            debugger;
                        },
                        dataReceived: function (data) {
                            debugger;
                        }
                    }
                });
            },

            onBindingChange: function (oEvent) {

                var oView = this.getView();
                var oElementBinding = oView.getElementBinding();

                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

                if (!oElementBinding.getBoundContext()) {

                    // Se não existe o registro e não estamos na operação de delete
                    if (!this._bDelete) {
                        oRouter.navTo("objNotFound");
                        return;
                    }
                } else {
                    this._oProduto = Object.assign({}, oElementBinding.getBoundContext().getObject());
                }
            },

            handleEditBtnPress: function () {

            },

            criarModel: function () {
                // Model produto
                var oModel = new JSONModel();
                this.getView().setModel(oModel, "MDL_Produto");
            },

            _HabilitaEdicao: function (bEdit) {
                var oView = this.getView();

                // Botões de ações
                oView.byId("btnEdit").setVisible(!bEdit);
                oView.byId("btnDelete").setVisible(!bEdit);
                oView.byId("btnSave").setVisible(bEdit);
                oView.byId("btnCancel").setVisible(bEdit);

                // Habilitar/Desabilitar Abas (seções) das páginas
                oView.byId("section1").setVisible(!bEdit);
                oView.byId("section2").setVisible(!bEdit);
                oView.byId("section3").setVisible(bEdit);

                if (bEdit) {
                    this._showFormFragments("Change", "vboxChangeProduct");
                } else {
                    this._showFormFragments("DisplayBasicInfo", "vboxViewBasicInfo");
                    this._showFormFragments("DisplayTechInfo", "vboxViewTechInfo");
                }
            },

            handleLink1Press: function () {

            },

            handleLink2Press: function () {

            },

            toggleFooter: function () {

            },

            onNavBack: function (oEvent) {
                this._HabilitaEdicao(false);
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                //oRouter.getTargets().display("lista");
                oRouter.navTo("lista");
            },

            onValida: function (oEvent) {
                var validator = new Validator();

                if (validator.validate(this.byId("vboxChangeProduct"))) {
                    this.onUpdate();
                }
            },

            onDelete: function (oEvent) {

            },

            handleCancelPress: function () {
                //var oModel = this.getView().getModel();
                //oModel.refresh(true);
                this._HabilitaEdicao(false);
            },

            handleEditPress: function (oEvent) {
                this.criarModel();

                var oModelProduto = this.getView().getModel("MDL_Produto");
                oModelProduto.setData(this._oProduto);

                this._HabilitaEdicao(true);
            },

            onCategoria: function (oEvent) {
                this._oInput = oEvent.getSource().getId();
                var oView = this.getView();

                // Verifico se o objeto fragment existe. Se não crio e adiciono na View
                if (!this._CategoriaSearchHelp) {
                    this._CategoriaSearchHelp = Fragment.load({
                        id: oView.getId(),
                        name: "br.com.gestao.fioriappadmin.frags.SH_Categorias",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    });
                }

                this._CategoriaSearchHelp.then(function (oDialog) {
                    // Limpando o filtro na abertura do fragment de categorias
                    oDialog.getBinding("items").filter([]);

                    // Abertura do fragment
                    oDialog.open();
                });
            },

            getSupplier: function (oEvent) {
                debugger;
                this._oInput = oEvent.getSource().getId();
                var oValue = oEvent.getSource().getValue();
                var sElement = "/Fornecedores('" + oValue + "')";

                var oModel = this.getView().getModel();
                var oModelProduto = this.getView().getModel("MDL_Produto");
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

            onSuggest: function (oEvent) {
                debugger;
                var sText = oEvent.getParameter("suggestValue");
                var aFilters = [];

                if (sText) {
                    aFilters.push(new Filter("Lifnr", FilterOperator.Contains, sText));
                }

                oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
            },

            onUpdate: function () {

                //  1 - Criando referência do Model
                var oModel = this.getView().getModel("MDL_Produto");
                var objUpdate = oModel.getData();
                var sPath = this.getView().getElementBinding().getPath();

                //  2 - Manipulando propriedades

                objUpdate.Price = objUpdate.Price.toString();
                objUpdate.Weightmeasure = objUpdate.Weightmeasure.toString();
                objUpdate.Width = objUpdate.Width.toString();
                objUpdate.Depth = objUpdate.Depth.toString();
                objUpdate.Height = objUpdate.Height.toString();
                objUpdate.Changedat = new Date().toISOString().substring(0, 19);

                delete objUpdate.to_cat;
                delete objUpdate.to_users;
                delete objUpdate.__metadata;

                // 3 - Criando uma referência do arquivo i18n
                var bundle = this.getView().getModel("i18n").getResourceBundle();
                var that = this;

                // 4 - Criar o objeto model rederência do model default (ODataModel)
                var oModelProduto = this.getView().getModel();

                MessageBox.confirm(
                    bundle.getText("updateDialogMsg", [objUpdate.Productid]),
                    function (oAction) {

                        // Verificando se o usuário confirmou ou não a operação
                        if (MessageBox.Action.OK === oAction) {

                            // Criando um BusyDialog
                            that._oBusyDialog = new BusyDialog({
                                text: bundle.getText("Sending")
                            });

                            that._oBusyDialog.open();

                            var oModelSend = new ODataModel(oModelProduto.sServiceUrl, true);
                            oModelSend.update(sPath, objUpdate, null,
                                function (d, r) {
                                    if (r.statusCode === 204) {

                                        // Fechando o BusyDialog
                                        that._oBusyDialog.close();

                                        // Voltar para somente leitura
                                        that.handleCancelPress();

                                        // Atualizando o model
                                        that.getView().getModel().refresh();

                                        // Limpando o model de edição
                                        that.getView().setModel(null, "MDL_Produto");

                                        // Mensagem de sucesso na tela
                                        MessageBox.success(
                                            bundle.getText("updateDialogSuccess", [objUpdate.Productid]), {
                                            onClose: function (oAction) {
                                                // Atualizando a tela
                                                var sPreviousHash = History.getInstance().getPreviousHash();
                                                history.go(-1);
                                            }.bind(this)
                                        });
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
                    }, bundle.getText("updateDialogTitle")
                );
            },

            onDelete: function () {

                //  1 - Criando referência do Model
                var objDelete = this.getView().getElementBinding().getBoundContext().getObject();
                var sPath = this.getView().getElementBinding().getPath();
                var bundle = this.getView().getModel("i18n").getResourceBundle();
                var that = this;
                var oModelProduto = this.getView().getModel();
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

                MessageBox.confirm(
                    bundle.getText("deleteDialogMsg", [objDelete.Productid]),
                    function (oAction) {

                        // Verificando se o usuário confirmou ou não a operação
                        if (MessageBox.Action.OK === oAction) {

                            // Criando um BusyDialog
                            that._oBusyDialog = new BusyDialog({
                                text: bundle.getText("Sending")
                            });

                            that._oBusyDialog.open();

                            var oModelSend = new ODataModel(oModelProduto.sServiceUrl, true);
                            oModelSend.remove(sPath, {
                                success: function (d, r) {
                                    if (r.statusCode === 204) {

                                        // Fechando o BusyDialog
                                        that._oBusyDialog.close();

                                        // Setando parâmetro de delete
                                        that._bDelete = true;

                                        // Mensagem de sucesso na tela
                                        MessageBox.success(
                                            bundle.getText("deleteDialogSuccess", [objDelete.Productid]), {
                                            actions: [MessageBox.Action.OK],
                                            onClose: function (oAction) {
                                                // Atualizando a tela
                                                that.getView().getModel().refresh();
                                                oRouter.navTo("lista");
                                            }.bind(this)
                                        });
                                    }
                                },
                                error: function (e) {
                                    // Fechando o BusyDialog
                                    that._oBusyDialog.close();
                                    var oRet = JSON.parse(e.responde.body);
                                    MessageToast.show(oRet.error.message.value, {
                                        duration: 5000
                                    });
                                }
                            });
                        }
                    }, bundle.getText("deleteDialogTitle")
                );
            }
        });
    });

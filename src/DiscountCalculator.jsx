import { useState } from "react";
import "./DiscountCalculator.css";

// категории товаров
const CATEGORIES = [
  {
    id: "electronics",
    label: "Электроника",
    discount: 5,
  },
  {
    id: "clothing",
    label: "Одежда",
    discount: 15,
  },
  {
    id: "groceries",
    label: "Продукты",
    discount: 10,
  },
  {
    id: "books",
    label: "Книги",
    discount: 20,
  },
  {
    id: "other",
    label: "Другое",
    discount: 0,
  },
];

// НДС
const VAT_RATE = 0.22;

// начальный товар
function createProduct() {
  return {
    id: Date.now() + Math.random(),
    price: "",
    category: "electronics",
  };
}

function DiscountCalculator() {

  // состояния

  const [products, setProducts] = useState([
    createProduct(),
  ]);

  const [promoCode, setPromoCode] = useState("");

  const [customDiscount, setCustomDiscount] = useState(0);

  const [useCustomDiscount, setUseCustomDiscount] = useState(false);

  const [includeVAT, setIncludeVAT] = useState(true);

  const [calculated, setCalculated] = useState(false);

  const [error, setError] = useState("");

  const [history, setHistory] = useState([]);

  // работа с продуктами

  // изменение цены товара
  function handlePriceChange(id, value) {
    // разрешаем только цифры и одну точку
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === id
            ? {
                ...product,
                price: value,
              }
            : product
        )
      );

      setCalculated(false);
      setError("");
    }
  }

  // изменение категории товара
  function handleCategoryChange(id, value) {
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === id
          ? {
              ...product,
              category: value,
            }
          : product
      )
    );

    setCalculated(false);
  }

  function handleAddProduct() {
    setProducts((currentProducts) => [
      ...currentProducts,
      createProduct(),
    ]);

    setCalculated(false);
  }

  function handleRemoveProduct(id) {

    if (products.length === 1) {
      return;
    }

    setProducts((currentProducts) =>
      currentProducts.filter((product) => product.id !== id)
    );

    setCalculated(false);
  }

  // расчёт

  function handleCalculate() {
    // проверяем все товары
    const invalidProduct = products.some((product) => {
      const number = parseFloat(product.price);

      return (
        !product.price.trim() ||
        isNaN(number) ||
        number <= 0
      );
    });

    if (invalidProduct) {
      setError(
        "Введите корректную положительную цену для всех товаров"
      );
      setCalculated(false);
      return;
    }

    setError("");
    setCalculated(true);

    // создаём запись для истории
    const result = calculateResults();

    const historyItem = {
      id: Date.now(),
      date: new Date().toLocaleString("ru-RU"),
      total: result.total,
      productsCount: products.length,
    };

    // сохраняем только последние 5 расчётов
    setHistory((currentHistory) => [
      historyItem,
      ...currentHistory,
    ].slice(0, 5));
  }

  function calculateResults() {
    let subtotal = 0;
    let totalDiscount = 0;

    const productResults = products.map((product) => {
      const price = parseFloat(product.price);

      const selectedCategory = CATEGORIES.find(
        (category) => category.id === product.category
      );

      const categoryDiscount = selectedCategory
        ? selectedCategory.discount
        : 0;

      const baseDiscount = useCustomDiscount
        ? customDiscount
        : categoryDiscount;

      // скидка категории / ручная скидка
      const baseDiscountAmount =
        price * (baseDiscount / 100);

      // цена после основной скидки
      const priceAfterBaseDiscount =
        price - baseDiscountAmount;

      // дополнительная скидка по промокоду
      const promoDiscount =
        promoCode.trim().toUpperCase() === "WELCOME10"
          ? 10
          : 0;

      const promoDiscountAmount =
        priceAfterBaseDiscount * (promoDiscount / 100);

      // итоговая цена товара
      const finalPrice =
        priceAfterBaseDiscount - promoDiscountAmount;

      subtotal += price;
      totalDiscount +=
        baseDiscountAmount + promoDiscountAmount;

      return {
        id: product.id,
        price,
        category: selectedCategory
          ? selectedCategory.label
          : "Другое",
        baseDiscount,
        baseDiscountAmount,
        promoDiscount,
        promoDiscountAmount,
        finalPrice,
      };
    });

    // НДС считается после всех скидок
    const vatAmount = includeVAT
      ? productResults.reduce(
          (sum, product) => sum + product.finalPrice,
          0
        ) * VAT_RATE
      : 0;

    const priceAfterDiscount =
      subtotal - totalDiscount;

    const total =
      priceAfterDiscount + vatAmount;

    return {
      productResults,
      subtotal,
      totalDiscount,
      priceAfterDiscount,
      vatAmount,
      total,
    };
  }

  // получаем актуальные результаты
  const results = calculated
    ? calculateResults()
    : {
        productResults: [],
        subtotal: 0,
        totalDiscount: 0,
        priceAfterDiscount: 0,
        vatAmount: 0,
        total: 0,
      };

  // сброс

  function handleReset() {
    setProducts([createProduct()]);
    setPromoCode("");
    setCustomDiscount(0);
    setUseCustomDiscount(false);
    setIncludeVAT(true);
    setCalculated(false);
    setError("");
  }

  // форматирование

  function formatRub(value) {
    return value.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <div className="calculator-wrapper">

      <h1 className="calculator-title">
        Калькулятор скидок
      </h1>

      {/*товары*/}

      <div className="products-section">

        <h2 className="section-title">
          Товары
        </h2>

        {products.map((product, index) => (
          <div
            className="product-card"
            key={product.id}
          >

            <div className="product-header">
              <h3>
                Товар {index + 1}
              </h3>

              {products.length > 1 && (
                <button
                  type="button"
                  className="remove-product"
                  onClick={() =>
                    handleRemoveProduct(product.id)
                  }
                >
                  Удалить
                </button>
              )}
            </div>

            {/*цена*/}
            <div className="field">
              <label
                htmlFor={`price-${product.id}`}
                className="field__label"
              >
                Цена товара (₽)
              </label>

              <input
                id={`price-${product.id}`}
                type="text"
                className={`field__input ${
                  error
                    ? "field__input--error"
                    : ""
                }`}
                value={product.price}
                onChange={(e) =>
                  handlePriceChange(
                    product.id,
                    e.target.value
                  )
                }
                placeholder="Например: 1000"
                inputMode="decimal"
              />
            </div>

            {/* Категория */}
            <div className="field">
              <label
                htmlFor={`category-${product.id}`}
                className="field__label"
              >
                Категория товара
              </label>

              <select
                id={`category-${product.id}`}
                className="field__input field__select"
                value={product.category}
                onChange={(e) =>
                  handleCategoryChange(
                    product.id,
                    e.target.value
                  )
                }
              >
                {CATEGORIES.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.label} — скидка{" "}
                    {category.discount}%
                  </option>
                ))}
              </select>
            </div>

          </div>
        ))}

        <button
          type="button"
          className="add-product"
          onClick={handleAddProduct}
        >
          + Добавить товар
        </button>

      </div>

      {/*промокод*/}

      <div className="field">

        <label
          htmlFor="promo"
          className="field__label"
        >
          Промокод
        </label>

        <input
          id="promo"
          type="text"
          className="field__input"
          value={promoCode}
          onChange={(e) => {
            setPromoCode(e.target.value);
            setCalculated(false);
          }}
          placeholder="Например: WELCOME10"
        />

        {promoCode.trim() && (
          <span
            className={
              promoCode.trim().toUpperCase() ===
              "WELCOME10"
                ? "promo-success"
                : "promo-info"
            }
          >
            {promoCode.trim().toUpperCase() ===
            "WELCOME10"
              ? "Промокод даёт дополнительную скидку 10%"
              : "Промокод не применён"}
          </span>
        )}

      </div>

      {/*каст скидка*/}

      <div className="custom-discount">

        <label className="checkbox-label">

          <input
            type="checkbox"
            checked={useCustomDiscount}
            onChange={(e) => {
              setUseCustomDiscount(
                e.target.checked
              );
              setCalculated(false);
            }}
          />

          Использовать ручную скидку
        </label>

        <div className="range-row">

          <input
            type="range"
            min="0"
            max="50"
            value={customDiscount}
            onChange={(e) => {
              setCustomDiscount(
                Number(e.target.value)
              );
              setCalculated(false);
            }}
            disabled={!useCustomDiscount}
          />

          <span className="range-value">
            {customDiscount}%
          </span>

        </div>

      </div>

      {/*ндс*/}

      <div className="vat-section">

        <label className="checkbox-label">

          <input
            type="checkbox"
            checked={includeVAT}
            onChange={(e) => {
              setIncludeVAT(
                e.target.checked
              );
              setCalculated(false);
            }}
          />

          Добавить НДС 22%
        </label>

      </div>

      {/*error*/}

      {error && (
        <div className="field__error">
          {error}
        </div>
      )}

      {/*кнопки*/}

      <div className="actions">

        <button
          type="button"
          className="btn btn--primary"
          onClick={handleCalculate}
        >
          Рассчитать
        </button>

        <button
          type="button"
          className="btn btn--secondary"
          onClick={handleReset}
        >
          Сбросить
        </button>

      </div>

      {/*результат*/}

      {calculated && !error && (
        <div className="results">

          <h2 className="results__title">
            Результат расчёта
          </h2>

          {/*инфа по товарам*/}

          <div className="product-results">

            {results.productResults.map(
              (product, index) => (
                <div
                  className="result-product"
                  key={product.id}
                >

                  <div className="result-product__title">
                    Товар {index + 1}
                  </div>

                  <div className="result-line">
                    <span>Категория</span>
                    <span>
                      {product.category}
                    </span>
                  </div>

                  <div className="result-line">
                    <span>Исходная цена</span>
                    <span>
                      {formatRub(product.price)} ₽
                    </span>
                  </div>

                  <div className="result-line">
                    <span>
                      Скидка{" "}
                      {product.baseDiscount}%
                    </span>
                    <span className="discount-value">
                      −
                      {formatRub(
                        product.baseDiscountAmount
                      )} ₽
                    </span>
                  </div>

                  {product.promoDiscount > 0 && (
                    <div className="result-line">
                      <span>
                        Промокод −10%
                      </span>
                      <span className="discount-value">
                        −
                        {formatRub(
                          product.promoDiscountAmount
                        )} ₽
                      </span>
                    </div>
                  )}

                  <div className="result-line result-line--final">
                    <span>
                      Цена после скидок
                    </span>
                    <span>
                      {formatRub(
                        product.finalPrice
                      )} ₽
                    </span>
                  </div>

                </div>
              )
            )}

          </div>

          {/*общ табл*/}

          <table className="results__table">
            <tbody>

              <tr>
                <td>
                  Сумма товаров
                </td>

                <td className="results__value">
                  {formatRub(
                    results.subtotal
                  )} ₽
                </td>
              </tr>

              <tr>
                <td>
                  Общая сумма скидок
                </td>

                <td className="results__value results__value--discount">
                  −
                  {formatRub(
                    results.totalDiscount
                  )} ₽
                </td>
              </tr>

              <tr>
                <td>
                  После скидок
                </td>

                <td className="results__value">
                  {formatRub(
                    results.priceAfterDiscount
                  )} ₽
                </td>
              </tr>

              <tr>
                <td>
                  НДС
                </td>

                <td className="results__value">
                  {includeVAT
                    ? `+${formatRub(
                        results.vatAmount
                      )} ₽`
                    : "Без НДС"}
                </td>
              </tr>

              <tr className="results__row--total">

                <td>
                  Итого к оплате
                </td>

                <td className="results__value">
                  {formatRub(
                    results.total
                  )} ₽
                </td>

              </tr>

            </tbody>
          </table>

        </div>
      )}

      {/*история*/}

      {history.length > 0 && (
        <div className="history">

          <h2 className="history__title">
            История расчётов
          </h2>

          <div className="history-list">

            {history.map((item) => (
              <div
                className="history-item"
                key={item.id}
              >

                <div>
                  <strong>
                    {item.productsCount}{" "}
                    {item.productsCount === 1
                      ? "товар"
                      : "товара"}
                  </strong>

                  <span className="history-date">
                    {item.date}
                  </span>
                </div>

                <strong className="history-total">
                  {formatRub(item.total)} ₽
                </strong>

              </div>
            ))}

          </div>

        </div>
      )}

    </div>
  );
}

export default DiscountCalculator;
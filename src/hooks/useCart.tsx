import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {

    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const addProductCart = [...cart];
      const productExist = addProductCart.find(product => product.id === productId);

      const productStock = await api.get(`/stock/${productId}`);
      const stockAmount = productStock.data.amount;

      const currentAmount = productExist ? productExist.amount : 0;

      const amount = currentAmount + 1;

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(productExist) {
        productExist.amount = amount;
      } else {
        const product = await api.get(`/products/${productId}`);

        // primeira vez criando um produto é preciso adicionar um amount
        const newProduct = {
          ...product.data,
          amount: 1,
        }

        addProductCart.push(newProduct);
      }

      setCart(addProductCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(addProductCart));
    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const removeProductCart = [...cart];
      const productExist = removeProductCart.findIndex(product => product.id === productId);

      if(productExist >= 0) {
        removeProductCart.splice(productExist, 1);
        setCart(removeProductCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(removeProductCart));
      } else {
        throw Error();
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) {
        return;
      }

      const productStock = await api.get(`/stock/${productId}`);
      const stockAmount = productStock.data.amount;

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      } else {
        const updateProductCart = [...cart];
        const productExist = updateProductCart.find(product => product.id === productId);

        if(productExist) {
          productExist.amount = amount;
          setCart(updateProductCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateProductCart));
        } else {
          throw Error();
        }
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

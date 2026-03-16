from llama_cpp import Llama

llm = Llama(
    model_path="/home/runner/workspace/.cache/huggingface/hub/models--TheBloke--Llama-2-7B-Chat-GGUF/snapshots/191239b3e26b2882fb562ffccdd1cf0f65402adb/llama-2-7b-chat.Q4_K_M.gguf",
    n_ctx=2048,
    n_threads=4,
)

output = llm(
    "Write a short story about a robot learning to paint:",
    max_tokens=256,
    temperature=0.7,
)

print(output["choices"][0]["text"])
